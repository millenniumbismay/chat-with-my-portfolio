import Portfolio from "./portfolio";
import { profile, projects, publications, experience } from "@/content/site";

export default function Home() {
  return (
    <Portfolio
      profile={profile}
      projects={projects}
      publications={publications}
      experience={experience}
    />
  );
}
