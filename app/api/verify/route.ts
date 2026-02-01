import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { PublicKey } from "@solana/web3.js";
import * as nacl from "tweetnacl";
import bs58 from "bs58";

export const dynamic = "force-dynamic";

// GET: Check if a wallet is verified for a Discord user
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    try {
        const db = await getDatabase();
        const user = await db.collection("users").findOne({ wallet_address: wallet });

        if (user) {
            return NextResponse.json({
                verified: true,
                discord_id: user.discord_id,
                registered_at: user.registered_at,
            });
        }

        return NextResponse.json({ verified: false });
    } catch (error) {
        console.error("Verification check error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Verify wallet ownership via signed message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, signature, message, discordId } = body;

        if (!wallet || !signature || !message) {
            return NextResponse.json(
                { error: "Missing required fields: wallet, signature, message" },
                { status: 400 }
            );
        }

        // Verify the signature
        const publicKey = new PublicKey(wallet);
        const signatureBytes = bs58.decode(signature);
        const messageBytes = new TextEncoder().encode(message);

        const isValid = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKey.toBytes()
        );

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // If Discord ID provided, save the verification
        if (discordId) {
            const db = await getDatabase();

            // Check if wallet already registered to another user
            const existingWallet = await db.collection("users").findOne({
                wallet_address: wallet,
                discord_id: { $ne: parseInt(discordId) },
            });

            if (existingWallet) {
                return NextResponse.json(
                    { error: "Wallet already registered to another Discord user" },
                    { status: 409 }
                );
            }

            // Update or insert user
            await db.collection("users").updateOne(
                { discord_id: parseInt(discordId) },
                {
                    $set: {
                        wallet_address: wallet,
                        registered_at: new Date(),
                        verified_via: "web",
                    },
                },
                { upsert: true }
            );

            return NextResponse.json({
                success: true,
                message: "Wallet verified and linked to Discord!",
            });
        }

        // Just verify signature without saving
        return NextResponse.json({
            success: true,
            verified: true,
            message: "Signature verified successfully",
        });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
