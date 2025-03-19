from aiogram import F, Router
from aiogram.types import Message
from aiogram.filters import CommandStart, Command

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message):
    await message.answer('Привет!')

@router.message(Command('Help'))
async def cmd_help(message: Message):
    await message.answer('Помощник в пути!')