import { useState } from 'react'
import {
  LogIn, LogOut, UserPlus, Key, Building2, Users,
  FileText, Download, Eye, CheckCircle, XCircle,
  CreditCard, AlertTriangle, Shield, Activity,
  ChevronDown, ChevronUp,
} from 'lucide-react'

/* ── Action metadata ─────────────────────────────────────── */
const ACTION_META = {
  LOGIN:                    { color: '#60a5fa', Icon: LogIn,       label: 'Login'                },
  LOGOUT:                   { color: '#45607a', Icon: LogOut,      label: 'Logout'               },
  REGISTER:                 { color: '#60a5fa', Icon: UserPlus,    label: 'Register'             },
  PASSWORD_CHANGE:          { color: '#60a5fa', Icon: Key,         label: 'Password Change'      },
  PASSWORD_RESET:           { color: '#60a5fa', Icon: Key,         label: 'Password Reset'       },
  COMPANY_CREATED:          { color: '#34d399', Icon: Building2,   label: 'Company Created'      },
  COMPANY_UPDATED:          { color: '#34d399', Icon: Building2,   label: 'Company Updated'      },
  USER_INVITED:             { color: '#34d399', Icon: Users,       label: 'User Invited'         },
  USER_REMOVED:             { color: '#f97316', Icon: Users,       label: 'User Removed'         },
  USER_ACCEPTED_INVITE:     { color: '#34d399', Icon: UserPlus,    label: 'Invite Accepted'      },
  BOE_CREATED:              { color: '#e9ba4c', Icon: FileText,    label: 'BOE Created'          },
  BOE_UPDATED:              { color: '#e9ba4c', Icon: FileText,    label: 'BOE Updated'          },
  BOE_DELETED:              { color: '#f87171', Icon: FileText,    label: 'BOE Deleted'          },
  BOE_EXPORTED_XML:         { color: '#e9ba4c', Icon: Download,    label: 'XML Export'           },
  BOE_VIEWED:               { color: '#8fa3bd', Icon: Eye,         label: 'BOE Viewed'           },
  CLASSIFICATION_APPROVED:  { color: '#4ade80', Icon: CheckCircle, label: 'Approved'             },
  CLASSIFICATION_REJECTED:  { color: '#f87171', Icon: XCircle,    label: 'Rejected'             },
  CLASSIFICATION_SUBMITTED: { color: '#a78bfa', Icon: Activity,    label: 'Submitted'            },
  SUBSCRIPTION_CHANGED:     { color: '#4ade80', Icon: CreditCard,  label: 'Plan Changed'         },
  PAYMENT_CREATED:          { color: '#4ade80', Icon: CreditCard,  label: 'Payment Created'      },
  PAYMENT_CONFIRMED:        { color: '#4ade80', Icon: CheckCircle, label: 'Payment Confirmed'    },
  PAYMENT_FAILED:           { color: '#f87171', Icon: XCircle,    label: 'Payment Failed'       },
  USER_DISABLED:            { color: '#f97316', Icon: Shield,      label: 'User Disabled'        },
  USER_ENABLED:             { color: '#4ade80', Icon: Shield,      label: 'User Enabled'         },
  USER_DELETED:             { color: '#f87171', Icon: Shield,      label: 'User Deleted'         },
  SETTINGS_CHANGED:         { color: '#a78bfa', Icon: Shield,      label: 'Settings Changed'     },
  COMPANY_SETTINGS_CHANGED: { color: '#a78bfa', Icon: Building2,   label: 'Company Settings'     },
}

function getMeta(action) {
  return ACTION_META[action] || { color: '#45607a', Icon: Activity, label: action }
}

/* ── Time ago ────────────────────────────────────────────── */
function timeAgo(d) {
  if (!d) return '—'
  const mins = Math.floor((Date.now() - new Date(d)) / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return new Date(d).toLocaleDateString()
}

function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString() : '—'
}

/* ── Empty & spinner ─────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 52 }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid rgba(30,58,95,0.4)',
        borderTopColor: '#e9ba4c', borderRadius: '50%',
        animation: 'ac-spin 0.7s linear infinite',
      }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <Activity size={38} color="#1e3a5f" style={{ margin: '0 auto 14px', display: 'block' }} strokeWidth={1.2} />
      <div style={{ fontSize: 14, fontWeight: 600, color: '#2a3d52', marginBottom: 5 }}>No events found</div>
      <div style={{ fontSize: 12, color: '#1e3a5f' }}>Try adjusting your filters or date range</div>
    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 18px', color: '#fca5a5',
      background: 'rgba(248,113,113,0.07)',
      borderRadius: 12, border: '1px solid rgba(248,113,113,0.18)',
      fontSize: 13, margin: '24px 0',
    }}>
      <AlertTriangle size={15} color="#f87171" strokeWidth={2} style={{ flexShrink: 0 }} />
      {msg}
    </div>
  )
}

/* ── Single timeline event ───────────────────────────────── */
function TimelineEvent({ log, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const { color, Icon, label } = getMeta(log.action)

  const hasDetails = log.details || log.ip_address || log.entity_type

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* Timeline rail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
        {/* Dot */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: color + '15', border: `1.5px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>
          <Icon size={14} color={color} strokeWidth={1.8} />
        </div>
        {/* Connector */}
        {!isLast && (
          <div style={{
            flex: 1, width: 1,
            background: 'rgba(30,58,95,0.35)',
            minHeight: 16, marginTop: 4,
          }} />
        )}
      </div>

      {/* Event card */}
      <div style={{
        flex: 1, minWidth: 0,
        marginLeft: 12,
        marginBottom: isLast ? 0 : 8,
        paddingBottom: isLast ? 0 : 4,
      }}>
        <div
          style={{
            background: 'rgba(10,18,32,0.7)',
            border: '1px solid rgba(30,58,95,0.4)',
            borderRadius: 12, overflow: 'hidden',
            transition: 'border-color 0.15s',
            cursor: hasDetails ? 'pointer' : 'default',
          }}
          onClick={() => hasDetails && setExpanded(x => !x)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.4)' }}
        >
          {/* Main row */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap',
            gap: 8, padding: '10px 14px',
          }}>
            {/* Action badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6,
              fontSize: 11, fontWeight: 700,
              background: color + '18', color,
              border: `1px solid ${color}35`,
              fontFamily: 'monospace', letterSpacing: '0.02em',
              flexShrink: 0,
            }}>
              {label}
            </span>

            {/* Entity */}
            {log.entity_type && (
              <span style={{ fontSize: 11, color: '#45607a', fontFamily: 'monospace' }}>
                {log.entity_type}
                {log.entity_id ? `#${log.entity_id}` : ''}
              </span>
            )}

            {/* Time */}
            <span style={{ fontSize: 11, color: '#2a3d52', marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {timeAgo(log.created_at)}
            </span>

            {/* Expand icon */}
            {hasDetails && (
              <span style={{ color: '#2a3d52', flexShrink: 0 }}>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            )}
          </div>

          {/* Actor row */}
          {(log.actor_name || log.company_name) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 14px 10px', flexWrap: 'wrap',
            }}>
              {log.actor_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: 'rgba(30,58,95,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#e9ba4c',
                  }}>
                    {log.actor_name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#8fa3bd' }}>
                    {log.actor_name}
                  </span>
                </div>
              )}
              {log.company_name && (
                <span style={{ fontSize: 11, color: '#45607a' }}>
                  · {log.company_name}
                </span>
              )}
            </div>
          )}

          {/* Expanded details */}
          {expanded && hasDetails && (
            <div style={{
              borderTop: '1px solid rgba(30,58,95,0.3)',
              padding: '10px 14px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {log.details && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#2a3d52', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, flexShrink: 0, minWidth: 70 }}>Details</span>
                  <span style={{ fontSize: 12, color: '#8fa3bd', lineHeight: 1.5 }}>{log.details}</span>
                </div>
              )}
              {log.ip_address && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#2a3d52', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, flexShrink: 0, minWidth: 70 }}>IP</span>
                  <span style={{ fontSize: 11, color: '#45607a', fontFamily: 'monospace' }}>{log.ip_address}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#2a3d52', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, flexShrink: 0, minWidth: 70 }}>Timestamp</span>
                <span style={{ fontSize: 11, color: '#45607a' }}>{fmtDateTime(log.created_at)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main timeline component ─────────────────────────────── */
export default function ActivityTimeline({ logs = [], loading = false, error = null }) {
  return (
    <>
      <style>{`@keyframes ac-spin { to { transform: rotate(360deg) } }`}</style>

      {loading  && <Spinner />}
      {!loading && error  && <ErrBox msg={error} />}
      {!loading && !error && logs.length === 0 && <EmptyState />}

      {!loading && !error && logs.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          {logs.map((log, i) => (
            <TimelineEvent key={log.id} log={log} isLast={i === logs.length - 1} />
          ))}
        </div>
      )}
    </>
  )
}
