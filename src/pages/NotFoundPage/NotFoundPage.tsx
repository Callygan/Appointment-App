import { useNavigate } from 'react-router-dom'
import { greenBtnCls } from '../../components/ui/buttons'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Text */}
        <div className="glass rounded-3xl px-8 py-8 max-w-sm w-full text-center flex flex-col gap-4">
          <div>
            <p className="text-7xl font-bold text-[#34c759] leading-none">404</p>
            <p className="text-xl font-semibold text-[#1d1d1f] mt-2">Pagina nu există</p>
          </div>
          <p className="text-sm text-[#6e6e73]">
            Se pare că această pagină a dispărut ca o manichiură veche.
            <br />Hai înapoi la programări!
          </p>
          <button className={`${greenBtnCls} w-full py-3`} onClick={() => navigate('/')}>
            Înapoi acasă
          </button>
        </div>
      </div>
    </div>
  )
}
