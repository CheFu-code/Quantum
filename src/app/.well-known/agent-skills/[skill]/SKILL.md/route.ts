import { getAgentSkill } from "../../../../_lib/agentSkills";

export const runtime = "nodejs";

export function GET(
  _request: Request,
  { params }: { params: Promise<{ skill: string }> },
) {
  return params.then(({ skill }) => {
    const agentSkill = getAgentSkill(skill);

    if (!agentSkill) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(agentSkill.content, {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  });
}
