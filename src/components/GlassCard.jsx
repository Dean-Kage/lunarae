export default function GlassCard({ children, hoverable = false, className = '', style = {}, onClick }) {
  return (
    <div
      className={`glass-card${hoverable ? ' glass-card-hover' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
