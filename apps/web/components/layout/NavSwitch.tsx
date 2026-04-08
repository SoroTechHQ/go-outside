import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

type NavSwitchRole = "attendee" | "organizer" | "admin";

export function NavSwitch({
  role = "attendee",
  userName = "Kofi Mensah",
}: {
  role?: NavSwitchRole;
  userName?: string;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Sidebar role={role} userName={userName} />
      </div>
      <div className="md:hidden">
        <BottomNav role={role} />
      </div>
    </>
  );
}

export default NavSwitch;
