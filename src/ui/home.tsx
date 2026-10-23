import Portfolio from "./portfolio";
import { profile, projects, publications } from "@/content/site";

export default function Home() {
  return <Portfolio profile={profile} projects={projects} publications={publications} />;
}
