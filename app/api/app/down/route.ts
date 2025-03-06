import { CreditsAmount, CreditsTransType, decreaseCredits, getUserCredits } from "@/services/credit";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getAppDownloadUrl } from "@/services/app";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    // console.log('Request received in down/route.ts'); // 调试日志
    
    const body = await req.json();
    // console.log('Request body:', body); // 调试日志
    
    const { app_id } = body;
    // console.log('Extracted app_id:', app_id); // 调试日志
    
    if (!app_id) {
    //   console.log('Invalid params: app_id is missing or empty'); // 调试日志
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    // console.log('User UUID:', user_uuid); // 调试日志
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    const user_credits = await getUserCredits(user_uuid);
    // console.log('User credits:', user_credits); // 调试日志
    
    if (user_credits.left_credits < CreditsAmount.PingCost) {
      return respErr("not enough credits");
    }

    const download_url = await getAppDownloadUrl(app_id.toString());
    // console.log('Download URL:', download_url); // 调试日志
    
    if (!download_url) {
      return respErr("app not found");
    }

    const token = sign(
      { 
        download_url,
        user_uuid,
        exp: Math.floor(Date.now() / 1000) + (60 * 5)
      },
      JWT_SECRET
    );
    // console.log('Generated token:', token); // 调试日志

    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: CreditsAmount.PingCost,
    });

    return respData({
      download_token: token
    });
  } catch (e: any) {
    // console.error("Download failed with error:", e); // 调试日志
    return respErr(e.message);
  }
}
