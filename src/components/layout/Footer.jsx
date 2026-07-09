import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    Home,
    Info,
    ShieldCheck,
    FileText
} from 'lucide-react'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export const Footer = () => {

    const navigate = useNavigate()
    const { t } = useTranslation()

    const year = new Date().getFullYear()

    const fadeUp = {
        hidden: {
            opacity: 0,
            y: 40
        },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: .6
            }
        }
    }

    return (

<motion.footer

initial="hidden"
whileInView="show"
viewport={{once:true}}

className="relative mt-20 bg-gray-950 text-white overflow-hidden"

>

{/* Background Glow */}

<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CA3433] via-red-400 to-[#CA3433]" />

<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#CA3433]/10 blur-[120px]" />

<div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16">

<motion.div

variants={fadeUp}

className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"

>

{/* =======================
LOGO
======================= */}

<div>

<motion.div

whileHover={{
scale:1.05,
rotate:0
}}

className="inline-flex items-center gap-3 cursor-pointer group"

onClick={()=>navigate("/")}

>

<div className="w-12 h-12 rounded-xl bg-white border-2 border-[#CA3433] flex items-center justify-center rotate-3 shadow-lg transition-all">

<div className="-rotate-3">

<span className="text-[#CA3433] text-2xl font-black">

G

</span>

<span className="text-[#CA3433] text-lg font-black -ml-1">

E

</span>

</div>

</div>

<div>

<h2 className="text-2xl font-black">

Go

<span className="text-[#CA3433]">

Eazy

</span>

</h2>

<p className="text-xs text-gray-400">

Housing Standard

</p>

</div>

</motion.div>

<p className="mt-6 text-gray-400 leading-7">

{t("footer.description")}

</p>

</div>

{/* ======================
QUICK LINKS
====================== */}

<div>

<h3 className="font-bold text-lg mb-6">

Browse

</h3>

<div className="space-y-4">

<Link

to="/search"

className="group flex items-center gap-2 text-gray-400 hover:text-white transition"

>

<Home size={16}/>

Search

<ArrowRight

size={14}

className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"

/>

</Link>

<Link

to="/nearby"

className="group flex items-center gap-2 text-gray-400 hover:text-white transition"

>

<MapPin size={16}/>

Nearby Services

<ArrowRight

size={14}

className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"

/>

</Link>

<Link

to="/about"

className="group flex items-center gap-2 text-gray-400 hover:text-white transition"

>

<Info size={16}/>

About

<ArrowRight

size={14}

className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"

/>

</Link>

</div>

</div>
{/* ======================
CONTACT
====================== */}

<div>

  <h3 className="font-bold text-lg mb-6">
    Contact
  </h3>

  <div className="space-y-4">

    <motion.a
      whileHover={{ scale: 1.03, x: 5 }}
      href="mailto:supportgoeazy@gmail.com"
      className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#CA3433] hover:bg-white/10 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-[#CA3433]/20 flex items-center justify-center">
        <Mail size={18} className="text-[#CA3433]" />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          Email
        </p>

        <p className="text-sm text-gray-400 break-all">
          supportgoeazy@gmail.com
        </p>
      </div>
    </motion.a>

    <motion.a
      whileHover={{ scale: 1.03, x: 5 }}
      href="tel:+918979452055"
      className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#CA3433] hover:bg-white/10 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-[#CA3433]/20 flex items-center justify-center">
        <Phone size={18} className="text-[#CA3433]" />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          Phone
        </p>

        <p className="text-sm text-gray-400">
          +91 89794 52055
        </p>
      </div>
    </motion.a>

  </div>

</div>

{/* ======================
LEGAL
====================== */}

<div>

  <h3 className="font-bold text-lg mb-6">
    Legal
  </h3>

  <div className="space-y-4">

    <Link
      to="/privacy"
      className="group flex items-center gap-2 text-gray-400 hover:text-white transition"
    >
      <ShieldCheck size={16} />

      {t('footer.links.privacy')}

      <ArrowRight
        size={14}
        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
      />
    </Link>

    <Link
      to="/terms"
      className="group flex items-center gap-2 text-gray-400 hover:text-white transition"
    >
      <FileText size={16} />

      {t('footer.links.terms')}

      <ArrowRight
        size={14}
        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
      />
    </Link>

    <Link
      to="/cookies"
      className="group flex items-center gap-2 text-gray-400 hover:text-white transition"
    >
      <FileText size={16} />

      {t('footer.links.cookie')}

      <ArrowRight
        size={14}
        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
      />
    </Link>

    <Link
      to="/refund"
      className="group flex items-center gap-2 text-gray-400 hover:text-white transition"
    >
      <FileText size={16} />

      {t('footer.links.refund')}

      <ArrowRight
        size={14}
        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition"
      />
    </Link>

  </div>

</div>

</motion.div>
{/* ======================
BOTTOM BAR
====================== */}

<motion.div
  variants={fadeUp}
  className="mt-16 pt-8 border-t border-white/10"
>

  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

    {/* Left */}

    <div className="text-center lg:text-left">

      <p className="text-sm text-gray-400">
        © {year} <span className="font-semibold text-white">GoEazy</span>. {t('footer.allRights')}
      </p>

      <p className="mt-2 text-xs text-gray-500">
        Built with ❤️ for students and professionals in Uttarakhand.
      </p>

    </div>

    {/* Right */}

    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="flex items-center gap-3"
    >

     

      
    </motion.div>

  </div>

</motion.div>

</div>

</motion.footer>

)
}