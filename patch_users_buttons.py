import re

with open("src/app/(authenticated)/admin/users/page.tsx", "r") as f:
    content = f.read()

content = content.replace('''<button
                      title="Edit user"
                      onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleDialog(true); }}
                      style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8590A2' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F1F2F4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Pencil size={14} />
                    </button>''', '<Button variant="ghost" size="icon" title="Edit user" onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleDialog(true); }} icon={<Pencil size={14} />} />')

content = content.replace('''<button
                      title={user.isActive ? "Deactivate user" : "Activate user"}
                      onClick={() => { setSelectedUser(user); setShowDeactivateDialog(true); }}
                      style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8590A2' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#FEE2E2';
                        e.currentTarget.style.color = '#DC2626';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#8590A2';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>''', '<Button variant="ghost" size="icon" title={user.isActive ? "Deactivate user" : "Activate user"} onClick={() => { setSelectedUser(user); setShowDeactivateDialog(true); }} className="hover:!bg-[#FEE2E2] hover:!text-[#DC2626]" icon={<Trash2 size={14} />} />')

with open("src/app/(authenticated)/admin/users/page.tsx", "w") as f:
    f.write(content)
