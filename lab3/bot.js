const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    `🤖 *Режим ChatGPT активовано*
    
Надішліть мені будь-яке питання, і я отримаю відповідь від ChatGPT!

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

async function handleChatGPTMessage(chatId, message) {
  try {
    // Show typing indicator
    bot.sendChatAction(chatId, 'typing');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Ти корисний асистент, який відповідає українською мовою. Давай короткі та інформативні відповіді."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    
    bot.sendMessage(chatId, 
      `🤖 *ChatGPT відповідає:*\n\n${response}`,
      { 
        parse_mode: 'Markdown',
        ...backKeyboard
      }
    );
    
  } catch (error) {
    console.error('OpenAI Error:', error);
    
    let errorMessage = '❌ Вибачте, виникла помилка при зверненні до ChatGPT.';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = '❌ Вичерпано ліміт запитів до ChatGPT API.';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = '❌ Невірний API ключ OpenAI.';
    }
    
    bot.sendMessage(chatId, errorMessage, backKeyboard);
  }
}

// Error handling
bot.on('error', (error) => {
  console.error('Telegram Bot Error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

// Health check endpoint for Render
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const express = require('express');
  const app = express();
  
  app.get('/', (req, res) => {
    res.json({ 
      status: 'Bot is running!', 
      timestamp: new Date().toISOString() 
    });
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });
  
  app.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
  });
}

console.log('🤖 Telegram bot started successfully!');
console.log('Make sure to set TELEGRAM_TOKEN and OPENAI_API_KEY in environment variables');