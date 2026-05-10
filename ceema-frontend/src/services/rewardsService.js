
import API from "../api/api";

// ─────────────────────────────────────────
// GET ALL REWARDS
// GET /api/rewards
// ─────────────────────────────────────────
export const getAllRewards = async () => {
  try {
    const { data } = await API.get("/api/rewards/")

    return data.map((reward) => ({
      id: reward.id,
      title: reward.name,
      points: reward.points_required,
      claps: reward.points_required,

      // fallback UI icon (keep emojis for now as requested)
      icon: "🎁"
    }))

  } catch (error) {
    console.error("Get rewards error:", error)
    return []
  }
}


// ─────────────────────────────────────────
// REDEEM REWARD
// POST /api/rewards/{id}/redeem/
// ─────────────────────────────────────────
export const redeemReward = async (id) => {
  try {
    const { data } = await API.post(`/api/rewards/${id}/redeem/`)

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error("Redeem reward error:", error)

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to redeem reward"
    }
  }
}
