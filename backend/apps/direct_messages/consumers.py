import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import DirectMessage, Conversation, TypingStatus
from .serializers import DirectMessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class DirectMessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Clear typing status on disconnect
        await self.update_typing_status(False)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')

        if message_type == 'message':
            message = text_data_json['message']
            # Save message to database
            saved_message = await self.save_message(message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': saved_message
                }
            )
        elif message_type == 'typing':
            is_typing = text_data_json['is_typing']
            await self.update_typing_status(is_typing)
            
            # Broadcast typing status
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_status',
                    'user_id': self.scope['user'].id,
                    'is_typing': is_typing
                }
            )

    async def chat_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))

    async def typing_status(self, event):
        # Send typing status to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    @database_sync_to_async
    def save_message(self, message_content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = DirectMessage.objects.create(
            conversation=conversation,
            sender=self.scope['user'],
            content=message_content
        )
        serializer = DirectMessageSerializer(message)
        return serializer.data

    @database_sync_to_async
    def update_typing_status(self, is_typing):
        conversation = Conversation.objects.get(id=self.conversation_id)
        TypingStatus.objects.update_or_create(
            user=self.scope['user'],
            conversation=conversation,
            defaults={'is_typing': is_typing}
        ) 