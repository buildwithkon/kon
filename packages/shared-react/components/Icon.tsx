const renderIcon = (icon: string, props: any) => {
  if (icon) {
    // Create a dynamic element using the icon string as the component name
    const WebcomponentIconComponent = icon as keyof JSX.IntrinsicElements
    return <WebcomponentIconComponent {...props} />
  }
}

const IconMap = {
  home: 'ph-house',
  forum: 'ph-chats-circle',
  message: 'ph-chats-circle',
  messages: 'ph-chats-circle',
  dm: 'ph-chats-circle',
  info: 'ph-info',
  schedule: 'ph-calendar-check',
  members: 'ph-users-three',
  users: 'ph-users-three',
  qa: 'ph-hand',
  menu: 'ph-text-indent',
  misc: 'ph-text-indent'
}

export const BottomBarIcon = (id: string, isActive: boolean, icon?: string) =>
  renderIcon(icon ?? IconMap[id] ?? 'ph-list', { size: '36', weight: isActive ? 'fill' : 'regular' })
