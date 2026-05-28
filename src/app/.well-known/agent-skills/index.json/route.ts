import {
  agentSkills,
  getAgentSkillDigest,
  getAgentSkillUrl,
} from "../../../_lib/agentSkills";

export const runtime = "nodejs";

export function GET() {
  return Response.json(
    {
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: agentSkills.map((skill) => {
        const digest = getAgentSkillDigest(skill.content);

        return {
          name: skill.name,
          type: skill.type,
          description: skill.description,
          url: getAgentSkillUrl(skill.slug),
          digest,
          sha256: digest,
        };
      }),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
