import asyncio
from aiogram import Bot, Dispatcher
from app.handler import router

async def main():
    TOKEN = '8195680709:AAEXgt0ANQLNxtSUQLWa0eHHYZHGH45SqvM'
    bot = Bot(TOKEN)
    dp = Dispatcher(bot=bot)
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except:
        print('Бот выключен!')