"""邮件发送服务（用于找回密码）"""

import logging
from typing import Optional

from fastapi import BackgroundTasks
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

from ..core.config import config

logger = logging.getLogger(__name__)


def _build_mail_config() -> ConnectionConfig:
    """根据环境变量构建邮件配置"""
    return ConnectionConfig(
        MAIL_USERNAME=config.MAIL_USERNAME,
        MAIL_PASSWORD=config.MAIL_PASSWORD,
        MAIL_FROM=config.MAIL_FROM or config.MAIL_USERNAME,
        MAIL_PORT=config.MAIL_PORT,
        MAIL_SERVER=config.MAIL_SERVER,
        MAIL_FROM_NAME=config.MAIL_FROM_NAME,
        MAIL_TLS=config.MAIL_TLS,
        MAIL_SSL=config.MAIL_SSL,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )


def send_reset_password_email(
    background_tasks: BackgroundTasks,
    email_to: str,
    token: str,
    reset_url: Optional[str] = None,
):
    """发送找回密码邮件，使用后台任务避免阻塞"""
    conf = _build_mail_config()

    if not reset_url:
        reset_url = f"https://example.com/reset-password?token={token}"

    html_body = f"""
    <p>您好，</p>
    <p>请点击以下链接重置密码（30分钟内有效）：</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>如果无法点击，请复制上方链接到浏览器打开。</p>
    <p>或直接使用以下Token完成重置：</p>
    <p><code>{token}</code></p>
    <p>若非本人操作，请忽略本邮件。</p>
    """

    message = MessageSchema(
        subject="SignLink 密码找回",
        recipients=[email_to],
        body=html_body,
        subtype="html",
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, message)
    logger.info("已提交密码重置邮件发送任务 -> %s", email_to)
