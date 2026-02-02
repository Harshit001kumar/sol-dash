export async function sendDiscordWebhook(embed: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("DISCORD_WEBHOOK_URL not set, skipping webhook.");
        return;
    }

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [embed]
            })
        });
    } catch (error) {
        console.error("Failed to send webhook:", error);
    }
}

export async function sendRaffleCreatedWebhook(raffle: any) {
    const embed = {
        title: "🎉 New Raffle Created!",
        description: `**${raffle.prize_name}**`,
        color: 0x9333ea, // Purple
        fields: [
            { name: "🎟️ Ticket Price", value: `${raffle.ticket_price} SOL`, inline: true },
            { name: "🏆 Prize", value: `${raffle.prize_type === 'sol' ? raffle.prize_amount + ' SOL' : 'NFT/Token'}`, inline: true },
            { name: "⏰ Ends In", value: `<t:${Math.floor(new Date(raffle.end_time).getTime() / 1000)}:R>`, inline: false },
            { name: "🔗 Join Now", value: `[Click to Buy Tickets](${process.env.NEXT_PUBLIC_APP_URL || "https://sol-raffle.onrender.com"}/raffles/${raffle.id})`, inline: false }
        ],
        image: { url: raffle.prize_image_url || undefined },
        footer: { text: "Solana Raffle System" },
        timestamp: new Date().toISOString()
    };
    await sendDiscordWebhook(embed);
}

export async function sendRaffleEndedWebhook(raffle: any, winnerWallet: string, winnerName: string) {
    const embed = {
        title: "🎊 Raffle Ended!",
        description: `The raffle for **${raffle.prize_name}** has ended.`,
        color: 0x10b981, // Emerald
        fields: [
            { name: "🏆 Winner", value: `${winnerName}\n\`${winnerWallet}\``, inline: false },
            { name: "🎟️ Total Tickets Sold", value: `${raffle.total_tickets}`, inline: true },
        ],
        thumbnail: { url: raffle.prize_image_url || undefined },
        footer: { text: "Congratualtions!" },
        timestamp: new Date().toISOString()
    };
    await sendDiscordWebhook(embed);
}

export async function sendAirdropWebhook(amount: string, tokenType: string, recipientCount: number, signature: string) {
    const embed = {
        title: "🚀 Airdrop Sent!",
        description: `An airdrop has been successfully distributed.`,
        color: 0x3b82f6, // Blue
        fields: [
            { name: "💰 Amount", value: `${amount} ${tokenType.toUpperCase()}`, inline: true },
            { name: "👥 Recipients", value: `${recipientCount} Users`, inline: true },
            { name: "🔗 Transaction", value: `[View on Solscan](https://solscan.io/tx/${signature})`, inline: false }
        ],
        footer: { text: "Solana Airdrop System" },
        timestamp: new Date().toISOString()
    };
    await sendDiscordWebhook(embed);
}
