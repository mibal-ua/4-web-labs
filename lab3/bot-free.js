const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// User states to track conversation flow
const userStates = {};

// Main menu keyboard
const mainMenuKeyboard = {
  reply_markup: {
    keyboard: [
      ['👨‍🎓 Студент', '💻 IT-технології'],
      ['📞 Контакти', '🤖 Prompt ChatGPT']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

// Back to menu keyboard
const backKeyboard = {
  reply_markup: {
    keyboard: [
      ['🔙 Назад']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

// Bot start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name || 'друже';
  
  bot.sendMessage(chatId, 
    `Вас вітає чат-бот! Виберіть відповідну команду`,
    mainMenuKeyboard
  );
});

// Handle menu selections
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;

  // Skip if it's a command
  if (text && text.startsWith('/')) {
    return;
  }

  switch (text) {
    case '👨‍🎓 Студент':
      await handleStudentInfo(chatId);
      break;
    
    case '💻 IT-технології':
      await handleITTechnologies(chatId);
      break;
    
    case '📞 Контакти':
      await handleContacts(chatId);
      break;
    
    case '🤖 Prompt ChatGPT':
      await handleChatGPTPrompt(chatId, userId);
      break;
    
    case '🔙 Назад':
      userStates[userId] = null;
      bot.sendMessage(chatId, 
        'Виберіть відповідну команду',
        mainMenuKeyboard
      );
      break;
    
    default:
      // Check if user is in ChatGPT mode
      if (userStates[userId] === 'chatgpt') {
        await handleChatGPTMessage(chatId, text);
      } else {
        bot.sendMessage(chatId, 
          'Будь ласка, виберіть команду з меню',
          mainMenuKeyboard
        );
      }
      break;
  }
});

// Handler functions
async function handleStudentInfo(chatId) {
  const studentInfo = `
👨‍🎓 *Інформація про студента*

📝 **Прізвище:** Балахон М.О.
🎓 **Група:** ІМ-22
🏫 **Факультет:** Інформатики та обчислювальної техніки
📚 **Спеціальність:** Інженерія програмного забезпечення
📅 **Курс:** 4
  `;
  
  bot.sendMessage(chatId, studentInfo, {
    parse_mode: 'Markdown',
    ...backKeyboard
  });
}

async function handleITTechnologies(chatId) {
  const techInfo = `
💻 *IT-технології*

🚀 **Front-end:**
• HTML5, CSS3, JavaScript
• React.js, Vue.js
• Bootstrap, Tailwind CSS

⚙️ **Back-end:**
• Node.js, Express.js
• Python, FastAPI
• MongoDB, PostgreSQL

🔧 **Інструменти:**
• Git, GitHub
• Docker, AWS
• VS Code, WebStorm
  `;
  
  bot.sendMessage(chatId, techInfo, {
    parse_mode: 'Markdown',
    ...backKeyboard
  });
}

async function handleContacts(chatId) {
  const contactInfo = `
📞 *Контактна інформація*

📱 **Телефон:** +380 50-555-55-55
📧 **Email:** student@example.com
💬 **Telegram:** @mibal_ua
🔗 **LinkedIn:** linkedin.com/in/mibal-ua
🌐 **GitHub:** github.com/mibal-ua
  `;
  
  bot.sendMessage(chatId, contactInfo, {
    parse_mode: 'Markdown',
    ...backKeyboard
  });
}

async function handleChatGPTPrompt(chatId, userId) {
  userStates[userId] = 'chatgpt';
  
  bot.sendMessage(chatId, 
    `🤖 *Режим AI асистента активовано*
    
Надішліть мені будь-яке питання, і я дам відповідь!

⚠️ *Увага:* Використовується локальний AI асистент замість ChatGPT через обмеження API.

Приклади запитів:
• "Розкажи про веб-технології"
• "Що таке React?"
• "Як працює Node.js?"`,
    {
      parse_mode: 'Markdown',
      ...backKeyboard
    }
  );
}

// Simple AI responses without external API
async function handleChatGPTMessage(chatId, message) {
  try {
    // Show typing indicator
    bot.sendChatAction(chatId, 'typing');
    
    // Simple rule-based responses
    const response = generateResponse(message.toLowerCase());
    
    bot.sendMessage(chatId, 
      `🤖 *AI асистент відповідає:*\n\n${response}`,
      { 
        parse_mode: 'Markdown',
        ...backKeyboard
      }
    );
    
  } catch (error) {
    console.error('Response Error:', error);
    bot.sendMessage(chatId, 
      '❌ Вибачте, виникла помилка при обробці запиту.',
      backKeyboard
    );
  }
}

// Simple response generator
function generateResponse(message) {
  const responses = {
    // Web technologies
    'веб': 'Веб-технології включають HTML, CSS, JavaScript для фронтенду та Node.js, Python для бекенду. Це основа сучасного інтернету.',
    'html': 'HTML (HyperText Markup Language) - це мова розмітки для створення структури веб-сторінок.',
    'css': 'CSS (Cascading Style Sheets) відповідає за стилізацію та візуальне оформлення веб-сторінок.',
    'javascript': 'JavaScript - це мова програмування для створення інтерактивних веб-додатків.',
    'react': 'React - це JavaScript бібліотека для створення користувацьких інтерфейсів, розроблена Facebook.',
    'node': 'Node.js дозволяє виконувати JavaScript на сервері, що робить можливим повнофункціональну веб-розробку.',
    
    // Programming
    'програмування': 'Програмування - це процес створення комп\'ютерних програм за допомогою мов програмування.',
    'алгоритм': 'Алгоритм - це послідовність дій для вирішення конкретної задачі.',
    'база даних': 'База даних - це організований набір структурованої інформації, що зберігається в комп\'ютерній системі.',
    
    // General
    'привіт': 'Привіт! Я AI асистент. Можу розповісти про веб-технології, програмування та багато іншого.',
    'дякую': 'Будь ласка! Радий допомогти. Якщо є ще питання - звертайтесь!',
    'допомога': 'Я можу розповісти про веб-технології, програмування, HTML, CSS, JavaScript, React, Node.js та інші IT теми.',
  };

  // Find matching response
  for (const [keyword, response] of Object.entries(responses)) {
    if (message.includes(keyword)) {
      return response;
    }
  }

  // Default responses based on question type
  if (message.includes('?') || message.includes('що') || message.includes('як')) {
    return 'Це цікаве питання! На жаль, я поки що навчаюсь і можу відповідати на базові питання про веб-технології. Спробуйте запитати про HTML, CSS, JavaScript, React або Node.js.';
  }

  if (message.includes('створити') || message.includes('зробити')) {
    return 'Для створення веб-додатків рекомендую вивчити HTML для структури, CSS для стилів, JavaScript для логіки та фреймворки як React або Vue.js.';
  }

  // Default response
  return `Дякую за повідомлення! Я простий AI асистент і найкраще відповідаю на питання про:
  
• Веб-технології (HTML, CSS, JavaScript)
• Фреймворки (React, Vue.js, Node.js)
• Програмування та алгоритми
• Бази даних

Спробуйте запитати щось з цих тем!`;
}

// Error handling
bot.on('error', (error) => {
  console.error('Telegram Bot Error:', error);
});

// Health check endpoint for Render
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const express = require('express');
  const app = express();
  
  app.get('/', (req, res) => {
    res.json({ 
      status: 'Bot is running!', 
      timestamp: new Date().toISOString(),
      mode: 'Free AI Assistant (No OpenAI)'
    });
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });
  
  app.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 Telegram bot started successfully!');
console.log('💡 Using local AI assistant (no OpenAI API required)');