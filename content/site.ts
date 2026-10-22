// Public presentation content. Replace the samples with your own work.
import config from "@/portfolio.config.json";
export const profile = config.profile;
export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  visual: string;
  body: string;
  url?: string;
  sample?: boolean;
};
export const projects: Project[] = [
  {
    id: "second-self",
    title: "A second self",
    category: "AI · EXPERIMENT",
    description:
      "A conversational window into a person’s work. Curated knowledge, a little personality, and better questions.",
    tags: ["LLMs", "Knowledge systems"],
    visual: "orbits",
    sample: true,
    body: "An illustrative project for this portfolio template. The idea: give visitors a conversational way to explore selected projects, writing, and professional experience.\n\nThe owner chooses which sources are included. Visitors can ask follow-up questions, while the assistant is instructed to acknowledge gaps in its knowledge. This portfolio includes the beginnings of that experience.",
  },
  {
    id: "small-tools",
    title: "Small tools, useful things",
    category: "OPEN SOURCE · EXPLORATION",
    description:
      "Experiments in making everyday workflows a little more thoughtful, and a lot less complicated.",
    tags: ["Developer tools", "Experiments"],
    visual: "blocks",
    sample: true,
    body: "This is an example project slot, ready for a real repository. Replace the title, description, links, and this detail with the problem you tackled, your approach, and what you learned.\n\nUse the knowledge studio to import public GitHub repositories and select the ones your assistant should be able to discuss.",
  },
];
export type Publication = {
  id: string;
  title: string;
  venue: string;
  year: string;
  description: string;
  url?: string;
  sample?: boolean;
};
export const publications: Publication[] = [
  {
    id: "publication-slot",
    title: "A place for your next big question",
    venue: "Your paper · Conference or journal",
    year: "—",
    description:
      "Your research belongs here. Add a paper title, author list, abstract, and a link to the publication or preprint. This is a sample entry, not a published paper.",
    sample: true,
  },
];
export type Post = {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  description: string;
  body: string;
  sample?: boolean;
};
export const posts: Post[] = [
  {
    id: "asking-better",
    title: "The art of asking better questions",
    category: "THINKING OUT LOUD",
    date: "Sample essay",
    readTime: "2 min read",
    description: "Sometimes the most useful thing you can build is a better question.",
    sample: true,
    body: "This is a sample essay to show how your writing will feel here.\n\nAn interesting project often begins before the first line of code. It begins with noticing a friction, an assumption, or a question that keeps returning.\n\nA useful question has edges. It tells you what you are trying to understand, what evidence might change your mind, and what a small next step could look like. ‘Can this be better?’ becomes ‘Where does someone lose their place, and what would help them continue?’\n\nThat shift makes the work smaller and the learning clearer. Start with the question. Build the smallest thing that helps you answer it. Then ask again.",
  },
  {
    id: "building-in-open",
    title: "A case for building in the open",
    category: "NOTES ON BUILDING",
    date: "Sample essay",
    readTime: "2 min read",
    description: "Work in progress has something to teach us, too.",
    sample: true,
    body: "This is a sample essay for the portfolio template.\n\nFinished projects tell one kind of story. Working notes tell another: the choices, dead ends, and small discoveries that shaped what eventually shipped.\n\nSharing the process gives other people something to engage with. A rough sketch invites a question. A small prototype makes an assumption visible. A clear note about what failed can save someone else an afternoon.\n\nBuilding in the open doesn’t mean sharing everything. It means choosing a useful part of the process and making it understandable. A little context is often more valuable than a polished announcement.",
  },
  {
    id: "human-side",
    title: "The human side of intelligent tools",
    category: "AI & PEOPLE",
    date: "Sample essay",
    readTime: "2 min read",
    description: "A few notes on designing technology that feels a little more human.",
    sample: true,
    body: "This is an illustrative essay, ready to be replaced by your own writing.\n\nA useful intelligent tool should make its boundaries understandable. What does it know? Where did the information come from? When should you check its answer?\n\nThese are design questions as much as engineering questions. A clear source, a well-placed explanation, or an honest ‘I don’t know’ can make an interaction easier to trust.\n\nThe aim is to help someone move forward with a clearer understanding. Sometimes that means an answer. Sometimes it means a better next question.",
  },
];
