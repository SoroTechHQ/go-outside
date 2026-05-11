import { EventDetailPage } from "../../../components/events/EventDetailPage"

type Props = { params: Promise<{ id: string }> }

export default function EventDetailRoute({ params }: Props) {
  return <EventDetailPage params={params} />
}
