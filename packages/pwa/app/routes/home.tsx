export const loader = async () => {
  return { bodyClass: 'bg-main text-main-fg' }
}

export default function Home() {
  return (
    <div className="wrapper flex min-h-screen items-center justify-center">
      HOME
    </div>
  )
}
