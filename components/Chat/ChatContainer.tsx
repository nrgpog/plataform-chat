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
  grid-template-columns: 250px 1fr;
  height: 100vh;
  background-color: #f5f5f5;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    position: relative;
  }
`

const Sidebar = styled.div`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    width: 80%;
    height: 100%;
    z-index: 10;
    transition: transform 0.3s ease-in-out;
    transform: translateX(-100%);
    
    &.open {
      transform: translateX(0);
    }
  }
`

const ChatArea = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  height: 100vh;

  @media (max-width: 768px) {
    width: 100%;
  }
`

const MessageList = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    height: calc(100vh - 80px);
  }
`

const MessageInput = styled.div`
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
  }
  
  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    
    @media (max-width: 768px) {
      font-size: 16px; /* Previene zoom en iOS */
    }
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    @media (max-width: 768px) {
      padding: 0.5rem;
      min-width: 60px;
    }
    
    &:hover {
      background-color: #2980b9;
    }
  }
`

const MenuButton = styled.button`
  display: none;
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  padding: 0.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [currentGroup, setCurrentGroup] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [tempUsername, setTempUsername] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Efecto para cargar grupos
  useEffect(() => {
    // Cargar grupos existentes
    const loadGroups = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) return
      if (data) setGroups(data)
    }

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
    if (!currentGroup) {
      setMessages([])
      return
    }
    
    // Cargar mensajes existentes
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', currentGroup)
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
      .channel(`messages:${currentGroup}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${currentGroup}`
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
  }, [currentGroup])

  const sendMessage = async () => {
    if (!currentMessage.trim() || !currentGroup || !username.trim()) {
      return
    }

    try {
      const messageData = {
        content: currentMessage.trim(),
        group_id: currentGroup,
        user_id: username.trim(),
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single()

      if (error) throw error

      setCurrentMessage('')
    } catch (error: any) {
      alert('Error al enviar el mensaje: ' + error.message)
    }
  }

  const createGroup = async () => {
    const name = prompt('Nombre del grupo:')

    if (!name) return

    try {
      const groupData = {
        name,
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
        setCurrentGroup(data.id)
      }
    } catch (error: any) {
      alert('Error al crear el grupo: ' + error.message)
    }
  }

  if (!username) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Ingresa tu nombre de usuario</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const trimmedUsername = tempUsername.trim();
          if (trimmedUsername) {
            setUsername(trimmedUsername);
          }
        }}>
          <input
            type="text"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
            style={{ 
              padding: '0.5rem', 
              marginRight: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            placeholder="Escribe tu nombre..."
            autoFocus
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            disabled={!tempUsername.trim()}
          >
            Comenzar
          </button>
        </form>
      </div>
    )
  }

  return (
    <ChatLayout>
      <MenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? '✕' : '☰'}
      </MenuButton>
      <Sidebar className={isSidebarOpen ? 'open' : ''}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Grupos</h2>
          <button
            onClick={createGroup}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
        {groups.map(group => (
          <div 
            key={group.id}
            onClick={() => setCurrentGroup(group.id)}
            style={{
              cursor: 'pointer',
              padding: '0.5rem',
              backgroundColor: currentGroup === group.id ? '#34495e' : 'transparent',
              borderRadius: '4px'
            }}
          >
            {group.name}
          </div>
        ))}
      </Sidebar>
      
      <ChatArea>
        <MessageList>
          {messages.map(message => (
            <div 
              key={message.id}
              style={{
                marginBottom: '0.5rem',
                textAlign: message.user_id === username ? 'right' : 'left'
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
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Enviar</button>
        </MessageInput>
      </ChatArea>
    </ChatLayout>
  )
} 