'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import { ChatMessage, ChatGroup } from '@/types/chat'
import styled from 'styled-components'
import { useSwipeable } from 'react-swipeable'

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

const Message = styled.div<{ isSwipedLeft?: boolean; isSwipedRight?: boolean }>`
  transform: translateX(${props => {
    if (props.isSwipedLeft) return '-50px';
    if (props.isSwipedRight) return '50px';
    return '0';
  }});
  transition: transform 0.3s ease;
  
  &::after {
    content: '↩️';
    position: absolute;
    top: 50%;
    opacity: ${props => (props.isSwipedLeft || props.isSwipedRight) ? '1' : '0'};
    transition: opacity 0.3s ease;
    transform: translateY(-50%);
    ${props => props.isSwipedLeft ? 'right: -30px;' : 'left: -30px;'}
  }
`

const MessageList = styled.div<{ $hasReply?: boolean }>`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: #1a1a1a;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  height: calc(100dvh - 70px);
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: calc(70px + ${props => props.$hasReply ? '40px' : '0px'});
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    z-index: 1;
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
  position: relative;
  
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
  
  .reply-preview {
    position: absolute;
    top: -40px;
    left: 0;
    right: 0;
    background: #1a1a1a;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #2d2d2d;
    font-size: 0.9rem;
    color: #888;
    z-index: 11;

    @media (max-width: 768px) {
      position: fixed;
      bottom: 70px;
      top: auto;
      box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
    }
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

const GroupItem = styled.div<{ $isSelected: boolean }>`
  cursor: pointer;
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  background: ${props => props.$isSelected ? '#2d2d2d' : 'transparent'};
  border: 1px solid ${props => props.$isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background: ${props => !props.$isSelected && 'rgba(255, 255, 255, 0.05)'};
  }

  .group-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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

  .group-type {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    color: #e0e0e0;
  }

  .invite-code {
    background: #2d2d2d;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      color: #e0e0e0;
      font-family: monospace;
    }

    button {
      background: transparent;
      border: none;
      color: #e0e0e0;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 0.25rem;
      }
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

const ReplyPreview = styled.div`
  position: absolute;
  bottom: 70px;
  left: 0;
  right: 0;
  background: #1a1a1a;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #2d2d2d;
  font-size: 0.9rem;
  color: #888;
  z-index: 11;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    
    &:hover {
      color: #aaa;
    }
  }

  @media (max-width: 768px) {
    position: fixed;
    box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  }
`

const SendButton = styled.button`
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
`

const ReplyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 14L4 9L9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 9H15C18.866 9 22 12.134 22 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PrivateGroupSelector = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  .selector-content {
    background: #242424;
    padding: 2rem;
    border-radius: 1rem;
    width: 100%;
    max-width: 400px;
    position: relative;
    overflow: hidden;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    padding: 1rem;
    background: #2d2d2d;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #333333;
    }

    input[type="checkbox"] {
      appearance: none;
      width: 20px;
      height: 20px;
      border: 2px solid #4a4a4a;
      border-radius: 4px;
      margin: 0;
      display: grid;
      place-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &::before {
        content: "";
        width: 12px;
        height: 12px;
        transform: scale(0);
        transition: transform 0.2s ease;
        box-shadow: inset 1em 1em #ffffff;
        transform-origin: center;
        clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
      }

      &:checked {
        background: #4a4a4a;
        border-color: #4a4a4a;

        &::before {
          transform: scale(1);
        }
      }

      &:focus {
        outline: none;
        border-color: #666666;
      }
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #e0e0e0;
      font-size: 0.95rem;
      user-select: none;
    }
  }
`

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface CustomCheckboxProps {
  $checked: boolean;
}

const CustomCheckbox = styled.div<CustomCheckboxProps>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #2d2d2d;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 1rem 0;

  &:hover {
    background: #333333;
  }

  .checkbox {
    width: 22px;
    height: 22px;
    border: 2px solid #4a4a4a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: ${props => props.$checked ? '#4a4a4a' : 'transparent'};

    svg {
      opacity: ${props => props.$checked ? 1 : 0};
      transform: scale(${props => props.$checked ? 1 : 0});
      transition: all 0.2s ease;
    }
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e0e0e0;
    font-size: 0.95rem;
    user-select: none;
  }
`

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InfoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  .modal-content {
    background: #242424;
    padding: 2rem;
    border-radius: 1rem;
    width: 100%;
    max-width: 400px;
    position: relative;
  }

  h3 {
    color: #e0e0e0;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    color: #aaa;
    margin: 1rem 0;
    line-height: 1.5;
  }

  .code-example {
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: monospace;
    margin: 1rem 0;
    color: #e0e0e0;
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }
  }
`

const GroupInfoButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
  }
`

const CopyNotification = styled.div<{ $show: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(${props => props.$show ? '0' : '20px'});
  background: #4CAF50;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  opacity: ${props => props.$show ? '1' : '0'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 16px;
    height: 16px;
  }
`

const CheckMarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CommandSuggestions = styled.div<{ $show: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #242424;
  border-radius: 0.5rem 0.5rem 0 0;
  overflow: hidden;
  transform: translateY(${props => props.$show ? '0' : '10px'});
  opacity: ${props => props.$show ? '1' : '0'};
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
  transition: all 0.2s ease;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
`

const CommandItem = styled.div<{ $isSelected: boolean }>`
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  background: ${props => props.$isSelected ? '#333333' : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    background: #333333;
  }

  .command-name {
    color: #e0e0e0;
    font-weight: 500;
  }

  .command-description {
    color: #888;
    font-size: 0.9rem;
  }

  .command-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2d2d2d;
    border-radius: 8px;
    color: #e0e0e0;
    padding: 6px;
  }
`

const JoinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12L15 8M19 12L15 16M19 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 9C9 7.89543 9.89543 7 11 7H12C13.1046 7 14 7.89543 14 9C14 10.1046 13.1046 11 12 11H12V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
);

const commands = [
  {
    name: '/join',
    description: 'Unirse a un grupo privado usando código de invitación',
    icon: <JoinIcon />,
    example: '/join ABC1234'
  },
  {
    name: '/help',
    description: 'Mostrar lista de comandos disponibles',
    icon: <HelpIcon />,
    example: '/help'
  }
];

// Componente MessageItem separado
const MessageItem = ({ 
  message, 
  userName, 
  swipedMessageId, 
  swipeDirection, 
  replyingTo,
  onSwipe,
  messages 
}: { 
  message: ChatMessage;
  userName: string;
  swipedMessageId: string | null;
  swipeDirection: 'left' | 'right' | null;
  replyingTo: ChatMessage | null;
  onSwipe: (messageId: string, direction: 'left' | 'right') => void;
  messages: ChatMessage[];
}) => {
  // Buscar si este mensaje es una respuesta a otro
  const repliedToMessage = message.reply_to ? messages.find(m => m.id === message.reply_to) : null;

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onSwipe(message.id, 'left'),
    onSwipedRight: () => onSwipe(message.id, 'right'),
    trackMouse: true,
    delta: 50,
    preventScrollOnSwipe: true,
    swipeDuration: 500
  });

  const isCurrentMessageSwiped = swipedMessageId === message.id;
  const currentSwipeDirection = isCurrentMessageSwiped ? swipeDirection : null;

  return (
    <div
      {...swipeHandlers}
      style={{ 
        textAlign: message.user_id === userName ? 'right' : 'left',
        transform: `translateX(${
          currentSwipeDirection === 'left' ? '-50px' : 
          currentSwipeDirection === 'right' ? '50px' : '0'
        })`,
        transition: 'transform 0.3s ease',
        position: 'relative',
        padding: '0.8rem 1.2rem',
        borderRadius: '1rem',
        marginBottom: '1rem',
        maxWidth: '85%',
        fontSize: '0.95rem',
        lineHeight: 1.5,
        wordBreak: 'break-word',
        background: message.user_id === userName ? '#4a4a4a' : '#2d2d2d',
        color: '#e0e0e0',
        marginLeft: message.user_id === userName ? 'auto' : '0',
        marginRight: message.user_id === userName ? '0' : 'auto',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {repliedToMessage && (
        <div style={{
          padding: '4px 8px',
          marginBottom: '8px',
          borderLeft: '2px solid #666',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#999',
          cursor: 'pointer'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: '2px',
            color: '#888'
          }}>
            <ReplyIcon />
            <span>{repliedToMessage.user_id}</span>
          </div>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {repliedToMessage.content}
          </div>
        </div>
      )}
      <strong style={{ 
        display: message.user_id === userName ? 'none' : 'block',
        fontSize: '0.8rem',
        marginBottom: '0.3rem',
        color: '#888888'
      }}>{message.user_id}</strong>
      {message.content}
      {message.image_url && (
        <img 
          src={message.image_url} 
          alt="Message attachment" 
          style={{ maxWidth: '200px', display: 'block', marginTop: '0.5rem' }}
        />
      )}
      {isCurrentMessageSwiped && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            [currentSwipeDirection === 'left' ? 'right' : 'left']: '-30px',
            opacity: 1,
            transition: 'opacity 0.3s ease',
            color: '#888'
          }}
        >
          <ReplyIcon />
        </div>
      )}
    </div>
  );
};

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isPrivateGroup, setIsPrivateGroup] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [replyPreview, setReplyPreview] = useState<string>('')
  const [createdInviteCode, setCreatedInviteCode] = useState<string>('')
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState(commands)

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

    // Suscribirse a cambios en los mensajes
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
      return;
    }

    try {
      const messageData = {
        content: newMessage.trim(),
        group_id: selectedGroup,
        user_id: userName.trim(),
        created_at: new Date().toISOString(),
        reply_to: replyingTo ? replyingTo.id : null
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single()

      if (error) throw error

      setNewMessage('');
      setReplyingTo(null);
      setReplyPreview('');
      setSwipedMessageId(null);
      setSwipeDirection(null);
    } catch (error: any) {
      console.error('Error al enviar el mensaje:', error);
      // Si hay un error con reply_to, intentamos enviar sin la referencia
      if (error.message.includes('reply_to')) {
        try {
          const messageData = {
            content: newMessage.trim(),
            group_id: selectedGroup,
            user_id: userName.trim(),
            created_at: new Date().toISOString()
          }

          const { error: secondError } = await supabase
            .from('messages')
            .insert([messageData])
            .select()
            .single()

          if (!secondError) {
            setNewMessage('');
            setReplyingTo(null);
            setReplyPreview('');
            setSwipedMessageId(null);
            setSwipeDirection(null);
          } else {
            alert('Error al enviar el mensaje: ' + secondError.message);
          }
        } catch (e: any) {
          alert('Error al enviar el mensaje: ' + e.message);
        }
      } else {
        alert('Error al enviar el mensaje: ' + error.message);
      }
    }
  }

  const generateInviteCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return

    try {
      const inviteCode = isPrivateGroup ? generateInviteCode() : undefined;
      
      const groupData = {
        name: newGroupName.trim(),
        created_at: new Date().toISOString(),
        is_private: isPrivateGroup,
        invite_code: inviteCode
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
        if (isPrivateGroup) {
          setCreatedInviteCode(inviteCode!)
        } else {
          setShowCreateGroupModal(false)
        }
      }
    } catch (error: any) {
      alert('Error al crear el grupo: ' + error.message)
    }
  }

  const handleMessage = async (message: string) => {
    if (message.startsWith('/join ')) {
      const code = message.split(' ')[1];
      if (code && code.length === 7) {
        try {
          const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('invite_code', code)
            .single()

          if (error) {
            alert('Código de invitación inválido')
            return
          }

          if (data) {
            setGroups(prevGroups => {
              if (!prevGroups.find(g => g.id === data.id)) {
                return [...prevGroups, data]
              }
              return prevGroups
            })
            setSelectedGroup(data.id)
          }
        } catch (error: any) {
          alert('Error al unirse al grupo: ' + error.message)
        }
      } else {
        alert('Código de invitación inválido')
      }
    } else {
      sendMessage()
    }
  }

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(createdInviteCode);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (err) {
      alert('Error al copiar el código');
    }
  }

  const handleSwipeAction = (messageId: string, direction: 'left' | 'right') => {
    setSwipedMessageId(messageId);
    setSwipeDirection(direction);
    
    const messageToReply = messages.find(m => m.id === messageId);
    if (messageToReply) {
      setReplyPreview(messageToReply.content);
      setReplyingTo(messageToReply);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyPreview('');
    setSwipedMessageId(null);
    setSwipeDirection(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCommands) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'Tab':
        e.preventDefault();
        if (filteredCommands[selectedCommandIndex]) {
          setNewMessage(filteredCommands[selectedCommandIndex].name + ' ');
          setShowCommands(false);
        }
        break;
      case 'Enter':
        if (showCommands && filteredCommands[selectedCommandIndex]) {
          e.preventDefault();
          setNewMessage(filteredCommands[selectedCommandIndex].name + ' ');
          setShowCommands(false);
        }
        break;
      case 'Escape':
        setShowCommands(false);
        break;
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.startsWith('/')) {
      const search = value.slice(1).toLowerCase();
      setFilteredCommands(
        commands.filter(cmd => 
          cmd.name.toLowerCase().includes(search) || 
          cmd.description.toLowerCase().includes(search)
        )
      );
      setShowCommands(true);
      setSelectedCommandIndex(0);
    } else {
      setShowCommands(false);
    }
  };

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

      {showInfoModal && (
        <InfoModal>
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowInfoModal(null)}>✕</button>
            <h3>
              <LockIcon />
              Grupo Privado
            </h3>
            <p>Este es un grupo privado. Para unirte necesitas un código de invitación.</p>
            <p>Si tienes un código, puedes unirte escribiendo en el chat:</p>
            <div className="code-example">/join CÓDIGO</div>
            <p>Por ejemplo: /join ABC1234</p>
          </div>
        </InfoModal>
      )}

      <CopyNotification $show={showCopyNotification}>
        <CheckMarkIcon />
        ¡Código copiado!
      </CopyNotification>

      {showCreateGroupModal && (
        <CreateGroupModal>
          <h3>Crear nuevo grupo</h3>
          <Input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nombre del grupo"
            autoFocus
          />
          <CustomCheckbox $checked={isPrivateGroup} onClick={() => setIsPrivateGroup(!isPrivateGroup)}>
            <div className="checkbox">
              {isPrivateGroup && <CheckIcon />}
            </div>
            <label>
              <LockIcon />
              Grupo Privado
            </label>
          </CustomCheckbox>
          {createdInviteCode && (
            <div className="invite-code">
              <span>{createdInviteCode}</span>
              <button onClick={copyInviteCode}>Copiar</button>
            </div>
          )}
          <div className="buttons">
            <CancelButton onClick={() => {
              setNewGroupName('')
              setIsPrivateGroup(false)
              setCreatedInviteCode('')
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
                $isSelected={selectedGroup === group.id}
                onClick={() => setSelectedGroup(group.id)}
              >
                <div className="group-name">
                  {group.name} {group.is_private && <LockIcon />}
                </div>
                {group.is_private && (
                  <GroupInfoButton onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoModal(group.id);
                  }}>
                    <InfoIcon />
                  </GroupInfoButton>
                )}
              </GroupItem>
            ))}
          </Sidebar>
          
          <ChatArea>
            <MessageList $hasReply={!!replyingTo}>
              {messages.map(message => (
                <MessageItem
                  key={message.id}
                  message={message}
                  userName={userName}
                  swipedMessageId={swipedMessageId}
                  swipeDirection={swipeDirection}
                  replyingTo={replyingTo}
                  onSwipe={handleSwipeAction}
                  messages={messages}
                />
              ))}
            </MessageList>
            {replyingTo && (
              <ReplyPreview>
                <span>Respondiendo a: {replyPreview}</span>
                <button onClick={cancelReply}>✕</button>
              </ReplyPreview>
            )}
            <MessageInput>
              <CommandSuggestions $show={showCommands}>
                {filteredCommands.map((cmd, index) => (
                  <CommandItem 
                    key={cmd.name}
                    $isSelected={index === selectedCommandIndex}
                    onClick={() => {
                      setNewMessage(cmd.name + ' ');
                      setShowCommands(false);
                    }}
                  >
                    <div className="command-icon">{cmd.icon}</div>
                    <div>
                      <div className="command-name">{cmd.name}</div>
                      <div className="command-description">{cmd.description}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandSuggestions>
              <Input
                type="text"
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                onKeyPress={(e) => e.key === 'Enter' && !showCommands && handleMessage(newMessage)}
                placeholder="Escribe un mensaje..."
              />
              <SendButton onClick={() => handleMessage(newMessage)}>
                Enviar
              </SendButton>
            </MessageInput>
          </ChatArea>
        </ChatLayout>
      )}
    </>
  )
} 