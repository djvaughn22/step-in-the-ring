// THE FRONT DOOR.
//
// The creation flow lives in app/create/RingApp.tsx and is mounted twice: here
// as the home page, and at /create as the full-screen workbench. Same
// component, same flow after the first sentence — a person who starts on
// either one ends up in exactly the same place.

import RingApp from "./create/RingApp";

export default function HomePage() {
  return <RingApp mode="home" />;
}
