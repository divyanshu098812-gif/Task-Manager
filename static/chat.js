class NexusChat {
  constructor() {
    this.isOpen = false;
    this.conversation = [];
    this.isTyping = false;
  }
  
  init() {
    this.createChatUI();
    this.attachEventListeners();
    this.showWelcomeMessage();
  }
  
  createChatUI() {
    const fab = document.createElement('button');
    fab.className = 'ai-fab';
    fab.id = 'ai-fab';
    fab.innerHTML = '🤖';
    fab.title = 'Open Nexus AI Assistant';
    document.body.appendChild(fab);
    
    const chatWindow = document.createElement('div');
    chatWindow.className = 'ai-chat-window';
    chatWindow.id = 'ai-chat-window';
    chatWindow.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-left">
          <div class="ai-chat-icon">🤖</div>
          <div>
            <div class="ai-chat-title">Nexus AI</div>
            <div class="ai-chat-subtitle">Your Smart Productivity Assistant</div>
          </div>
        </div>
        <div class="ai-chat-header-actions">
          <button class="ai-chat-header-btn" id="ai-minimize" title="Minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="ai-chat-header-btn" id="ai-close" title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      
      <div class="ai-quick-actions" id="ai-quick-actions">
        <button class="ai-quick-action" data-action="plan-day">📅 Plan My Day</button>
        <button class="ai-quick-action" data-action="analyze">📊 Analyze Productivity</button>
        <button class="ai-quick-action" data-action="which-first">🎯 Which Task First?</button>
        <button class="ai-quick-action" data-action="todays-deadlines">⏰ Today's Deadlines</button>
        <button class="ai-quick-action" data-action="weekly-summary">📈 Weekly Report</button>
        <button class="ai-quick-action" data-action="motivate">💪 Motivate Me</button>
      </div>
      
      <div class="ai-chat-messages" id="ai-chat-messages"></div>
      
      <div class="ai-chat-input">
        <div class="ai-input-wrapper">
          <textarea 
            class="ai-textarea" 
            id="ai-textarea" 
            placeholder="Ask Nexus AI anything..."
            rows="1"
          ></textarea>
          <button class="ai-send-btn" id="ai-send-btn" title="Send message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(chatWindow);
  }
  
  attachEventListeners() {
    document.getElementById('ai-fab').addEventListener('click', () => this.toggle());
    document.getElementById('ai-close').addEventListener('click', () => this.close());
    document.getElementById('ai-minimize').addEventListener('click', () => this.close());
    document.getElementById('ai-send-btn').addEventListener('click', () => this.sendMessage());
    
    const textarea = document.getElementById('ai-textarea');
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
    
    document.querySelectorAll('.ai-quick-action').forEach(btn => {
      btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    this.isOpen = true;
    document.getElementById('ai-chat-window').classList.add('open');
    document.getElementById('ai-textarea').focus();
  }
  
  close() {
    this.isOpen = false;
    document.getElementById('ai-chat-window').classList.remove('open');
  }
  
  showWelcomeMessage() {
    const messagesDiv = document.getElementById('ai-chat-messages');
    messagesDiv.innerHTML = `
      <div class="ai-welcome">
        <div class="ai-welcome-icon">🤖</div>
        <div class="ai-welcome-title">Hi! I'm Nexus AI</div>
        <div class="ai-welcome-text">
          I'm your intelligent productivity assistant. I can help you plan your day,
          analyze your productivity, create task roadmaps, and much more!
          <br><br>
          Try the quick actions above or just ask me anything!
        </div>
      </div>
    `;
  }
  
  addMessage(content, isUser = false) {
    const messagesDiv = document.getElementById('ai-chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `ai-chat-message ${isUser ? 'user' : 'ai'}`;
    
    const avatarLetter = isUser ? (window.currentUsername || 'U')[0].toUpperCase() : '🤖';
    const name = isUser ? 'You' : 'Nexus AI';
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.innerHTML = `
      <div class="ai-message-avatar ${isUser ? 'user' : 'ai'}">${avatarLetter}</div>
      <div class="ai-message-content">
        <div class="ai-message-name">${name}</div>
        <div class="ai-message-bubble">${this.formatMessage(content)}</div>
        <div class="ai-message-time">${time}</div>
      </div>
    `;
    
    messagesDiv.appendChild(messageEl);
    this.scrollToBottom();
    
    this.conversation.push({
      role: isUser ? 'user' : 'assistant',
      content: content
    });
  }
  
  formatMessage(content) {
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    
    return formatted;
  }
  
  showTyping() {
    const messagesDiv = document.getElementById('ai-chat-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-chat-message ai';
    typingEl.id = 'ai-typing-indicator';
    typingEl.innerHTML = `
      <div class="ai-message-avatar ai">🤖</div>
      <div class="ai-message-content">
        <div class="ai-message-name">Nexus AI</div>
        <div class="ai-message-bubble">
          <div class="ai-typing">
            <div class="ai-typing-dot"></div>
            <div class="ai-typing-dot"></div>
            <div class="ai-typing-dot"></div>
          </div>
        </div>
      </div>
    `;
    messagesDiv.appendChild(typingEl);
    this.scrollToBottom();
    this.isTyping = true;
  }
  
  hideTyping() {
    const typingEl = document.getElementById('ai-typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
    this.isTyping = false;
  }
  
  scrollToBottom() {
    const messagesDiv = document.getElementById('ai-chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
  async sendMessage() {
    const textarea = document.getElementById('ai-textarea');
    const message = textarea.value.trim();
    
    if (!message || this.isTyping) return;
    
    this.addMessage(message, true);
    textarea.value = '';
    textarea.style.height = 'auto';
    
    this.showTyping();
    
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          conversation: this.conversation.slice(-10)
        })
      });
      
      const data = await response.json();
      
      this.hideTyping();
      
      if (data.success) {
        this.addMessage(data.response, false);
      } else {
        this.addMessage('⚠️ ' + (data.error || 'Something went wrong. Please try again.'), false);
      }
    } catch (error) {
      this.hideTyping();
      this.addMessage('⚠️ Failed to connect to AI service. Please check your internet connection and try again.', false);
      console.error('Chat error:', error);
    }
  }
  
  async handleQuickAction(action) {
    this.showTyping();
    
    try {
      const response = await fetch(`/api/chat/quick-action/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      this.hideTyping();
      
      if (data.success) {
        const actionNames = {
          'plan-day': 'Plan my day',
          'analyze': 'Analyze my productivity',
          'which-first': 'Which task should I do first?',
          'todays-deadlines': "Show today's deadlines",
          'weekly-summary': 'Give me a weekly summary',
          'motivate': 'Motivate me'
        };
        this.addMessage(actionNames[action] || action, true);
        this.addMessage(data.response, false);
      } else {
        this.addMessage('⚠️ ' + (data.error || 'Something went wrong. Please try again.'), false);
      }
    } catch (error) {
      this.hideTyping();
      this.addMessage('⚠️ Failed to connect to AI service. Please check your internet connection and try again.', false);
      console.error('Quick action error:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.nexusChat) return;
  
  window.nexusChat = new NexusChat();
  window.nexusChat.init();
  
  const usernameEl = document.querySelector('.topnav-username');
  if (usernameEl) {
    window.currentUsername = usernameEl.textContent.trim();
  }
});
