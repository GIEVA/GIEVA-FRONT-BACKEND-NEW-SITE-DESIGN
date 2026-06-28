import { RoomServiceClient } from "livekit-server-sdk";

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
);

export async function sendJoinRequest(session, user) {

    try {

        const payload = Buffer.from(
            JSON.stringify({

                type: "JOIN_REQUEST",

                sessionId: session.id,

                userId: user.id,

                identity: `user-${user.id}`,

                fullName: user.fullName,

                profilePicUrl:
                    user.profilePicUrl || "",

                sessionType:
                    session.sessionType,
            })
        );

        await roomService.sendData(
            session.roomName,
            payload,
            0
        );

    } catch (err) {

        console.warn(
            "JOIN_REQUEST failed:",
            err.message
        );
    }
}