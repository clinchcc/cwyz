import { CreditsAmount, CreditsTransType, decreaseCredits, getUserCredits } from "@/services/credit";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";

export async function POST(req: Request) {
  try {
    const { download_url } = await req.json();
    if (!download_url) {
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const user_credits = await getUserCredits(user_uuid);
    if (user_credits.left_credits < CreditsAmount.PingCost) {
      return respErr("not enough credits");
    }

    // Decrease credits for download
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: CreditsAmount.PingCost,
    });

    return respData({
      download_url: download_url,
    });
  } catch (e: any) {
    console.log("download failed:", e);
    return respErr(e.message);
  }
}
