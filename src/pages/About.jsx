import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ShieldCheck,
  HeartHandshake,
  Home,
  Users,
} from 'lucide-react'

export const About = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const values = [
    {
      icon: ShieldCheck,
      title: "Trust",
      description: "Every listing is verified to provide a reliable home-search experience.",
    },
    {
      icon: Home,
      title: "Transparency",
      description: "Real photos, genuine listings, and no hidden surprises.",
    },
    {
      icon: HeartHandshake,
      title: "Community",
      description: "Helping students and professionals find a place they can truly call home.",
    },
  ]

  return (
    <div className="relative overflow-hidden bg-white min-h-screen">

      {/* Background */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-[#CA3433]/5 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-red-100/70 blur-3xl" />

      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-14 pb-24">

        {/* Back Button */}

        <motion.button
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -3 }}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-[#CA3433] hover:text-[#CA3433]"
        >
          <ArrowLeft size={18} />
          {t("aboutPage.back", "Back")}
        </motion.button>

        {/* Hero */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-20 max-w-5xl text-center"
        >

          <p className="text-sm font-bold uppercase tracking-[0.4em] text-[#CA3433]">

            ABOUT GOEAZY

          </p>

          <h1 className="mt-8 text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight">

            {t("aboutPage.title", "The Story of GoEazy")}

          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-gray-500">

            Helping students and professionals discover trusted homes with confidence.

          </p>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ delay: .3 }}
            className="mx-auto mt-10 h-1 rounded-full bg-[#CA3433]"
          />

        </motion.section>

        {/* Values */}

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: .5 }}
          className="mt-24 grid gap-8 md:grid-cols-3"
        >

          {values.map((item) => {

            const Icon = item.icon

            return (

              <motion.div
                key={item.title}
                whileHover={{ y: -6 }}
                transition={{ duration: .2 }}
                className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl transition-all"
              >

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CA3433]/10">

                  <Icon
                    className="text-[#CA3433]"
                    size={30}
                  />

                </div>

                <h3 className="mt-8 text-2xl font-bold text-gray-900">

                  {item.title}

                </h3>

                <p className="mt-4 leading-8 text-gray-500">

                  {item.description}

                </p>

              </motion.div>

            )

          })}

        </motion.section>

        {/* Story Section */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .6 }}
          className="mt-28"
        >

          <div className="mx-auto max-w-5xl rounded-[32px] border border-gray-100 bg-white p-8 md:p-14 shadow-xl">

            <h2 className="text-3xl font-bold text-gray-900">

              Our Story

            </h2>

            <div className="mt-10 space-y-10 text-xl leading-[2] text-gray-600">
                            <p>
                {t(
                  "aboutPage.section1Text",
                  "We've all been there: scrolling through endless fake listings, calling brokers who never answer, and visiting 'premium flats' that look nothing like the photos. Finding a home away from home shouldn't be a nightmare. That's exactly why GoEazy was built—to finally bring transparency, trust, and ease to the rental market."
                )}
              </p>

              <p>
                {t(
                  "aboutPage.section2Text",
                  "We personally vet properties so you don't have to. Real photos, direct contact with owners, and zero hidden surprises. Whether you're a student moving to a new city or a professional seeking a peaceful corner, GoEazy is designed to make your transition as smooth as possible."
                )}
              </p>

            </div>
          </div>
        </motion.section>

        {/* Thank You Section */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24"
        >
          <div className="mx-auto max-w-4xl rounded-[32px] border border-gray-200 bg-gradient-to-br from-white to-red-50 p-10 md:p-16 shadow-lg">

            <div className="flex justify-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#CA3433]/10">

                <HeartHandshake
                  size={40}
                  className="text-[#CA3433]"
                />

              </div>

            </div>

            <h2 className="mt-8 text-center text-4xl font-black text-gray-900">

              Thank You

            </h2>

            <p className="mx-auto mt-8 max-w-3xl text-center text-xl leading-9 text-gray-600 italic">

              {t(
                "aboutPage.thankYouNote",
                '"Thank you for trusting GoEazy. We are constantly working to bring you better homes, better experiences, and complete peace of mind."'
              )}

            </p>

            <div className="mx-auto mt-10 h-1 w-28 rounded-full bg-[#CA3433]" />

          </div>
        </motion.section>

        {/* Footer */}

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-24 text-center"
        >

          <div className="mx-auto max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gray-400">

              TRUST • TRANSPARENCY • COMMUNITY

            </p>

            <h3 className="mt-6 text-3xl font-bold text-gray-900">

              Building Better Experiences

            </h3>

            <p className="mt-4 text-lg leading-8 text-gray-500">

              Every journey starts with finding the right place to call home.
              GoEazy is committed to making that journey simple, transparent,
              and stress-free.

            </p>

          </div>

        </motion.section>

      </div>
    </div>
  )
}
      