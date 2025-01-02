'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import { ChatMessage, ChatGroup } from '@/types/chat'
import styled from 'styled-components'

interface SidebarProps {
  isOpen: boolean;
}

const ChatLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100dvh;
  background: #1a1a1a;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    position: fixed;
    height: 100dvh;
  }
`

const Sidebar = styled.div`
  background: #242424;
  color: #e0e0e0;
  padding: 1.5rem;
  overflow-y: auto;
  border-right: 1px solid #2d2d2d;
  height: 100dvh;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    width: 85%;
    height: 100dvh;
    z-index: 20;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-100%);
    
    &.open {
      transform: translateX(0);
    }
  }
`

const ChatArea = styled.div`
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  height: 100dvh;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    height: 100dvh;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`

const MessageList = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: #1a1a1a;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  height: calc(100dvh - 70px);
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: calc(70px + 1rem);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(100dvh - 70px);
  }

  /* Estilo para los mensajes */
  > div {
    padding: 0.8rem 1.2rem;
    border-radius: 1rem;
    margin-bottom: 1rem;
    max-width: 85%;
    position: relative;
    font-size: 0.95rem;
    line-height: 1.5;
    word-break: break-word;
    
    &[style*="text-align: right"] {
      margin-left: auto;
      background: #4a4a4a;
      color: #e0e0e0;
      border-bottom-right-radius: 0.3rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      
      strong {
        display: none;
      }
    }

    &[style*="text-align: left"] {
      margin-right: auto;
      background: #2d2d2d;
      color: #e0e0e0;
      border-bottom-left-radius: 0.3rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

      strong {
        display: block;
        font-size: 0.8rem;
        margin-bottom: 0.3rem;
        color: #888888;
      }
    }
  }
`

const MessageInput = styled.div`
  padding: 1.2rem;
  background: #242424;
  border-top: 1px solid #2d2d2d;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 0.8rem;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #242424;
    z-index: 10;
    min-height: 70px;
    box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.2);
  }
  
  input {
    flex: 1;
    padding: 0.7rem 1rem;
    border: none;
    background: #333333;
    border-radius: 20px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    color: #e0e0e0;
    
    &:focus {
      outline: none;
      background: #3d3d3d;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }
    
    &::placeholder {
      color: #888888;
    }
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
  
  button {
    padding: 0.7rem;
    background: #4a4a4a;
    color: #e0e0e0;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
      background: #555555;
    }

    &:active {
      transform: scale(0.95);
    }
  }
`

const MenuButton = styled.button`
  display: none;
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 30;
  width: 40px;
  height: 40px;
  padding: 0;
  background: #4a4a4a;
  color: #e0e0e0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    background: #555555;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`

const UserNameModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #242424;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  width: 90%;
  max-width: 400px;

  h3 {
    margin: 0 0 1.5rem 0;
    color: #e0e0e0;
    font-size: 1.5rem;
    text-align: center;
    font-weight: 600;
  }
`

const Button = styled.button`
  padding: 0.7rem 1.2rem;
  background: #4a4a4a;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: scale(1.02);
    background: #555555;
  }

  &:active {
    transform: scale(0.98);
  }
`

const Input = styled.input`
  padding: 0.7rem 1rem;
  border: none;
  background: #333333;
  border-radius: 20px;
  width: 100%;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
  color: #ffffff;

  &:focus {
    outline: none;
    background: #3d3d3d;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  &::placeholder {
    color: #aaaaaa;
  }
`

const UserNameDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  background: #2d2d2d;
  border-radius: 20px;
  margin-bottom: 1.5rem;

  span {
    font-weight: 500;
    flex: 1;
    color: #e0e0e0;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    border-radius: 20px;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`

const GroupItem = styled.div<{ isSelected: boolean }>`
  cursor: pointer;
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  background: ${props => props.isSelected ? '#2d2d2d' : 'transparent'};
  border: 1px solid ${props => props.isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: #e0e0e0;
  
  &:hover {
    background: ${props => !props.isSelected && 'rgba(255, 255, 255, 0.05)'};
  }
`

const CreateGroupButton = styled.button`
  width: 32px;
  height: 32px;
  padding: 0;
  background: #4a4a4a;
  color: #e0e0e0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  line-height: 1;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: #555555;
  }

  &:active {
    transform: scale(0.95);
  }
`

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #2d2d2d;

  h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0;
  }
`

const CreateGroupModal = styled(UserNameModal)`
  h3 {
    color: #e0e0e0;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;

    button {
      flex: 1;
      width: auto;
    }
  }

  @media (max-width: 768px) {
    width: 95%;
    padding: 1.5rem;
  }
`

const CancelButton = styled(Button)`
  background: transparent;
  color: #e0e0e0;
  border: 1px solid #2d2d2d;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: scale(1.02);
  }
`

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) return
    if (data) setGroups(data)
  }

  useEffect(() => {
    // Cargar el nombre de usuario del localStorage al iniciar
    const savedUserName = localStorage.getItem('chatUserName')
    if (savedUserName) {
      setUserName(savedUserName)
    } else {
      setShowUserNameModal(true)
    }
    loadGroups()
    setIsLoading(false)
  }, [])

  const handleUserNameSubmit = (newName: string) => {
    if (newName.trim()) {
      setUserName(newName.trim())
      localStorage.setItem('chatUserName', newName.trim())
      setShowUserNameModal(false)
    }
  }

  const handleChangeUserName = () => {
    setShowUserNameModal(true)
  }

  // Efecto para cargar grupos
  useEffect(() => {
    // Configurar canal de grupos
    const groupsChannel = supabase.channel('public:groups')

    groupsChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'groups'
        },
        (payload) => {
          const newGroup = payload.new as ChatGroup
          setGroups(prev => [...prev, newGroup])
        }
      )
      .subscribe()

    // Iniciar carga de grupos
    loadGroups()

    // Cleanup
    return () => {
      supabase.removeChannel(groupsChannel)
    }
  }, [])

  // Efecto para cargar mensajes cuando cambia el grupo
  useEffect(() => {
    if (!selectedGroup) {
      setMessages([])
      return
    }
    
    // Cargar mensajes existentes
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', selectedGroup)
        .order('created_at', { ascending: true })
      
      if (error) return
      if (data) {
        const uniqueMessages = new Map(data.map(msg => [msg.id, msg]))
        setMessages(Array.from(uniqueMessages.values()))
      }
    }
    loadMessages()

    // Suscribirse a cambios en los mensajes del grupo actual
    const channel = supabase
      .channel(`messages:${selectedGroup}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${selectedGroup}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => {
            const messagesMap = new Map(prev.map(msg => [msg.id, msg]))
            if (!messagesMap.has(newMessage.id)) {
              messagesMap.set(newMessage.id, newMessage)
            }
            return Array.from(messagesMap.values())
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedGroup])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !userName.trim()) {
      return
    }

    try {
      const messageData = {
        content: newMessage.trim(),
        group_id: selectedGroup,
        user_id: userName.trim(),
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single()

      if (error) throw error

      setNewMessage('')
    } catch (error: any) {
      alert('Error al enviar el mensaje: ' + error.message)
    }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return

    try {
      const groupData = {
        name: newGroupName.trim(),
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('groups')
        .insert([groupData])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setGroups(prevGroups => [...prevGroups, data])
        setSelectedGroup(data.id)
        setNewGroupName('')
        setShowCreateGroupModal(false)
      }
    } catch (error: any) {
      alert('Error al crear el grupo: ' + error.message)
    }
  }

  if (isLoading) {
    return null // O podrías retornar un spinner/loader aquí
  }

  return (
    <>
      {showUserNameModal && (
        <UserNameModal>
          <h3>Ingresa tu nombre de usuario</h3>
          <Input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nombre de usuario"
            autoFocus
          />
          <Button onClick={() => handleUserNameSubmit(userName)}>
            Guardar
          </Button>
        </UserNameModal>
      )}

      {showCreateGroupModal && (
        <CreateGroupModal>
          <h3>Crear nuevo grupo</h3>
          <Input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nombre del grupo"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && createGroup()}
          />
          <div className="buttons">
            <CancelButton onClick={() => {
              setNewGroupName('')
              setShowCreateGroupModal(false)
            }}>
              Cancelar
            </CancelButton>
            <Button onClick={createGroup}>
              Crear Grupo
            </Button>
          </div>
        </CreateGroupModal>
      )}

      {!showUserNameModal && (
        <ChatLayout>
          <MenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '✕' : '☰'}
          </MenuButton>
          <Sidebar className={isSidebarOpen ? 'open' : ''}>
            <UserNameDisplay>
              <span>{userName}</span>
              <Button onClick={handleChangeUserName}>Cambiar nombre</Button>
            </UserNameDisplay>
            <GroupHeader>
              <h2>Grupos</h2>
              <CreateGroupButton onClick={() => setShowCreateGroupModal(true)}>
                +
              </CreateGroupButton>
            </GroupHeader>
            {groups.map(group => (
              <GroupItem 
                key={group.id}
                isSelected={selectedGroup === group.id}
                onClick={() => setSelectedGroup(group.id)}
              >
                {group.name}
              </GroupItem>
            ))}
          </Sidebar>
          
          <ChatArea>
            <MessageList>
              {messages.map(message => (
                <div 
                  key={message.id}
                  style={{
                    marginBottom: '0.5rem',
                    textAlign: message.user_id === userName ? 'right' : 'left'
                  }}
                >
                  <strong>{message.user_id}</strong>: {message.content}
                  {message.image_url && (
                    <img 
                      src={message.image_url} 
                      alt="Message attachment" 
                      style={{ maxWidth: '200px', display: 'block', marginTop: '0.5rem' }}
                    />
                  )}
                </div>
              ))}
            </MessageList>
            
            <MessageInput>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Enviar</button>
            </MessageInput>
          </ChatArea>
        </ChatLayout>
      )}
    </>
  )
} 