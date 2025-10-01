import os
import logging
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from revChatGPT.V1 import Chatbot

# Завантаження змінних середовища
load_dotenv()

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Ініціалізація ChatGPT
chatbot = None
token = os.getenv('CHATGPT_ACCESS_TOKEN')
if token:
    logger.info(f"Attempting to initialize ChatGPT with token starting with: {token[:10]}...")
    try:
        chatbot = Chatbot(config={"access_token": token})
        logger.info("ChatGPT initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize ChatGPT: {type(e).__name__}: {e}")
        chatbot = None
else:
    logger.warning("CHATGPT_ACCESS_TOKEN not found in environment variables")

# Стани користувачів
user_states = {}

# Клавіатури
main_menu_keyboard = ReplyKeyboardMarkup([
    [KeyboardButton("👨‍🎓 Студент"), KeyboardButton("💻 IT-технології")],
    [KeyboardButton("📞 Контакти"), KeyboardButton("🤖 Prompt ChatGPT")]
], resize_keyboard=True, one_time_keyboard=False)

back_keyboard = ReplyKeyboardMarkup([
    [KeyboardButton("🔙 Назад")]
], resize_keyboard=True, one_time_keyboard=False)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обробник команди /start"""
    user = update.effective_user
    await update.message.reply_html(
        f"Вас вітає чат-бот! Виберіть відповідну команду",
        reply_markup=main_menu_keyboard
    )

async def handle_student_info(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обробник інформації про студента"""
    student_info = """
👨‍🎓 *Інформація про студента*

📝 **Прізвище:** Балахон М.О.
🎓 **Група:** ІМ-22
🏫 **Факультет:** Інформатики та обчислювальної техніки
📚 **Спеціальність:** Інженерія програмного забезпечення
📅 **Курс:** 4
    """
    
    await update.message.reply_markdown(student_info, reply_markup=back_keyboard)

async def handle_it_technologies(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обробник IT-технологій"""
    tech_info = """
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
    """
    
    await update.message.reply_markdown(tech_info, reply_markup=back_keyboard)

async def handle_contacts(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обробник контактів"""
    contact_info = """
📞 *Контактна інформація*

📱 **Телефон:** +380 50-555-55-55
📧 **Email:** student@example.com
💬 **Telegram:** @mibal_ua
🔗 **LinkedIn:** linkedin.com/in/mibal-ua
🌐 **GitHub:** github.com/mibal-ua
    """
    
    await update.message.reply_markdown(contact_info, reply_markup=back_keyboard)

async def handle_chatgpt_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Активація режиму ChatGPT"""
    user_id = update.effective_user.id
    user_states[user_id] = 'chatgpt'
    
    if chatbot:
        message = """
🤖 *Режим ChatGPT активовано*

Надішліть мені будь-яке питання, і я отримаю відповідь від ChatGPT!

Приклади запитів:
• "Розкажи про веб-технології"
• "Що таке React?"
• "Як працює Node.js?"
        """
    else:
        message = """
⚠️ *ChatGPT недоступний*

На жаль, не вдалося підключитися до ChatGPT.
Перевірте налаштування ACCESS_TOKEN.

Поки що можу відповідати на базові питання про програмування.
        """
    
    await update.message.reply_markdown(message, reply_markup=back_keyboard)

async def handle_chatgpt_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обробка повідомлень для ChatGPT"""
    user_message = update.message.text
    logger.info(f"Processing ChatGPT request: {user_message[:50]}...")
    
    # Показати індикатор набору
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')
    
    try:
        if chatbot:
            # Використання revChatGPT
            logger.info("Sending request to ChatGPT...")
            response = ""
            for data in chatbot.ask(user_message):
                response = data.get("message", "")
                logger.debug(f"Received data from ChatGPT: {data}")
            
            if not response:
                raise Exception("Empty response from ChatGPT")
            
            logger.info(f"ChatGPT response received: {response[:100]}...")
            await update.message.reply_markdown(
                f"🤖 *ChatGPT відповідає:*\n\n{response}",
                reply_markup=back_keyboard
            )
        else:
            # Локальні відповіді якщо ChatGPT недоступний
            logger.warning("ChatGPT not available, using local responses")
            response = generate_local_response(user_message.lower())
            await update.message.reply_markdown(
                f"🤖 *AI асистент відповідає:*\n\n{response}",
                reply_markup=back_keyboard
            )
            
    except Exception as e:
        logger.error(f"ChatGPT Error: {e}")
        await update.message.reply_text(
            "❌ Вибачте, виникла помилка при зверненні до ChatGPT.",
            reply_markup=back_keyboard
        )

def generate_local_response(message):
    """Генерація локальних відповідей"""
    responses = {
        'веб': 'Веб-технології включають HTML, CSS, JavaScript для фронтенду та Node.js, Python для бекенду.',
        'html': 'HTML - це мова розмітки для створення структури веб-сторінок.',
        'css': 'CSS відповідає за стилізацію та візуальне оформлення веб-сторінок.',
        'javascript': 'JavaScript - мова програмування для створення інтерактивних веб-додатків.',
        'react': 'React - JavaScript бібліотека для створення користувацьких інтерфейсів.',
        'node': 'Node.js дозволяє виконувати JavaScript на сервері.',
        'python': 'Python - універсальна мова програмування, популярна для веб-розробки та AI.',
    }
    
    for keyword, response in responses.items():
        if keyword in message:
            return response
    
    return "Дякую за повідомлення! Я можу розповісти про веб-технології, HTML, CSS, JavaScript, React, Node.js та Python."

async def handle_back(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Повернення до головного меню"""
    user_id = update.effective_user.id
    user_states[user_id] = None
    
    await update.message.reply_text(
        "Виберіть відповідну команду",
        reply_markup=main_menu_keyboard
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Основний обробник повідомлень"""
    text = update.message.text
    user_id = update.effective_user.id
    
    if text == "👨‍🎓 Студент":
        await handle_student_info(update, context)
    elif text == "💻 IT-технології":
        await handle_it_technologies(update, context)
    elif text == "📞 Контакти":
        await handle_contacts(update, context)
    elif text == "🤖 Prompt ChatGPT":
        await handle_chatgpt_prompt(update, context)
    elif text == "🔙 Назад":
        await handle_back(update, context)
    elif user_states.get(user_id) == 'chatgpt':
        await handle_chatgpt_message(update, context)
    else:
        await update.message.reply_text(
            "Будь ласка, виберіть команду з меню",
            reply_markup=main_menu_keyboard
        )

def main() -> None:
    """Запуск бота"""
    # Створення додатку
    application = Application.builder().token(os.getenv('TELEGRAM_TOKEN')).build()
    
    # Додавання обробників
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Health check сервер для Render
    if os.getenv('NODE_ENV') == 'production' or os.getenv('RENDER'):
        import threading
        from http.server import HTTPServer, BaseHTTPRequestHandler
        import json
        
        class HealthHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/' or self.path == '/health':
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {
                        'status': 'Bot is running!',
                        'timestamp': str(os.times()),
                        'chatgpt_available': chatbot is not None,
                        'chatgpt_token_set': bool(os.getenv('CHATGPT_ACCESS_TOKEN')),
                        'telegram_token_set': bool(os.getenv('TELEGRAM_TOKEN'))
                    }
                    self.wfile.write(json.dumps(response).encode())
                else:
                    self.send_response(404)
                    self.end_headers()
                    
            def log_message(self, format, *args):
                pass  # Suppress HTTP logs
        
        def run_health_server():
            port = int(os.getenv('PORT', 8000))
            server = HTTPServer(('0.0.0.0', port), HealthHandler)
            print(f"🌐 Health check server running on port {port}")
            server.serve_forever()
        
        health_thread = threading.Thread(target=run_health_server, daemon=True)
        health_thread.start()
    
    # Запуск бота
    print("🤖 Telegram bot started successfully!")
    if chatbot:
        print("✅ ChatGPT connection established")
    else:
        print("⚠️ ChatGPT not available, using local responses")
    
    application.run_polling()

if __name__ == '__main__':
    main()