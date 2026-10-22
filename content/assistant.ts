import config from "@/portfolio.config.json";

// All public identity copy derives from the same configuration as the model prompt.
export const assistant = {
  ...config.assistant,
  action: `Ask ${config.assistant.name}`,
  greeting: `Hello. I’m ${config.assistant.name}.`,
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function identityReply(question: string, owner: string): string | null {
  const name = escapeRegex(assistant.name);
  const asksIdentity =
    /\b(?:who are you|what(?:’s|'s| is) your name|what (?:should|can) i call you|tell me about yourself)\b/i.test(
      question,
    ) || new RegExp(`\\b(?:are you|who is|what is) ${name}[!,.?\\s]*$`, "i").test(question.trim());
  const greeting = new RegExp(
    `^(?:(?:hi|hello|hey)(?:[,!.\\s]+${name})?|${name})[!,.?\\s]*$`,
    "i",
  ).test(question.trim());
  if (!asksIdentity && !greeting) return null;
  return `${assistant.greeting} I’m ${owner}’s ${assistant.role}. I’m here to help you explore their projects, publications, and writing, using the sources they’ve chosen to share. What would you like to explore?`;
}

export function demoReply(question: string, owner: string): string {
  const identity = identityReply(question, owner);
  if (identity)
    return `${identity}\n\nI’m in demo mode for now; the real work and profile haven’t been added yet.`;
  if (/research|publication|paper/i.test(question))
    return `${assistant.name} here. There’s a space for research and publications, with abstracts and paper links. This preview uses sample publications, so I don’t have selected research to discuss yet.\n\nOnce real sources are added, I can walk you through the ideas and point you to the papers.`;
  if (/read|blog|writ|note/i.test(question))
    return `I’m ${assistant.name}. The blog pages show how writing will appear here, with an “Ask about this” action for follow-up questions.\n\nThese entries are illustrative. I’ll be able to discuss ${owner}’s real writing once they select it as a source.`;
  if (/linkedin|github|source|know|data/i.test(question))
    return `I’m ${assistant.name}. My knowledge comes from sources ${owner} explicitly selects: project summaries, professional background, papers, and writing. Source studio is where those choices are reviewed.\n\nThis is demo mode. I’m not connected to their accounts, and excluded drafts stay out of my answers.`;
  return `I’m ${assistant.name}, ${owner}’s ${assistant.role}. This is a demo for now, so I can show how a conversational portfolio works.\n\nThe owner selects the projects, papers, and writing I can discuss. The real profile and selected sources still need to be added. What catches your interest?`;
}
