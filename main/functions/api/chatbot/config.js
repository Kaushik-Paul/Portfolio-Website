export async function onRequestGet(context) {
    return Response.json(
        {
            healthApiKey: context.env.AI_CHAT_HEALTH_API_KEY || '',
            chatApiKey: context.env.AI_CHAT_CHAT_API_KEY || '',
        },
        {
            headers: {
                'Cache-Control': 'no-store',
            },
        }
    );
}
