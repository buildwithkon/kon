const BADGES = ['🤠 2024 Presententer', '🐵 Staff']

export default function Badge() {
  return (
    <ul className="my-10">
      {BADGES.map((badge) => (
        <li
          key={badge}
          className="mr-2.5 mb-2 inline-flex items-center justify-center rounded-2xl border-2 border-muted px-4 py-2 font-bold text-lg"
        >
          {badge}
        </li>
      ))}
    </ul>
  )
}
