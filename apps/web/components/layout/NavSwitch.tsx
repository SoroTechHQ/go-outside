import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

type NavSwitchRole = "attendee" | "organizer" | "admin";

export function NavSwitch({
  role = "attendee",
  userName = "",
  avatarUrl,
  username,
  email,
}: {
  role?: NavSwitchRole;
  userName?: string;
  avatarUrl?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Sidebar role={role} userName={userName} avatarUrl={avatarUrl} username={username} email={email} />
      </div>
      <div className="md:hidden">
        <BottomNav role={role} />
      </div>
    </>
  );
}

export default NavSwitch;
