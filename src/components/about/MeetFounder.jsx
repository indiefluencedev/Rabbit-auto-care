'use client';

import Image from 'next/image';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export default function MeetFounder() {
  return (
    <section className="w-full flex justify-center px-4 md:px-16 lg:px-8 xl:px-4 md:pb-16 lg:py-16">
      <div className="max-w-[1240px] w-full bg-[#f5f5f5] rounded-[50px] p-6 md:p-12 lg:p-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-0">

          {/* Left: Heading + Paragraphs */}
          <div className="flex-1  space-y-6 text-left">
            {/* Mobile/Tablet: Gradient heading */}
<h2 className="text-[40px] md:text-[56px] lg:text-[45px] xl:text-[58px] font-bold bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent w-fit block lg:hidden ">
 <span className='font-bold' > Meet The Founder </span>
</h2>

{/* Desktop: Plain black heading */}
<h2 className="hidden lg:block text-[45px] xl:text-[58px] font-bold bg-gradient-to-r from-[#601E8D] to-black bg-clip-text text-transparent">
<span className='font-bold' >Meet The Founder</span>
</h2>



            <p className="text-[16px] text-[#1A1A1A] leading-relaxed max-w-xl">
            Rabbit Auto Care was born from frustration and obsession. Our founder, a design purist and car care fanatic, saw the gap — cluttered labels, average formulas, and zero vibe. So they built what didn’t exist: a brand where detailing meets design, and every swipe feels like a statement.


            </p>

            <p className="text-[16px] text-[#1A1A1A] leading-relaxed max-w-xl">
            From handwritten thank-you notes to GSM-marked microfiber, nothing at Rabbit is random. The founder’s vision? Create products that car lovers actually want to show off. Built with precision, styled with intent, and engineered to perform — this isn’t just a brand, it’s their personal rebellion against boring car care.
            </p>
            <div className='flex gap-4' >
              <a href='https://www.linkedin.com/in/pratham-goel-43ba9b1a8?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app' target="_blank" rel="noopener noreferrer">
                <Linkedin className="hover:text-[#0A66C2] transition-colors" />
              </a>
              <a href='https://www.instagram.com/purplexed.goel?igsh=bjkwcDFpdm45cmJn&utm_source=qr' target="_blank" rel="noopener noreferrer">
                <Instagram className="hover:text-[#E4405F] transition-colors" />
              </a>
            </div>

          </div>

          {/* Right: Founder Image */}
          <div className="flex-1 flex justify-center">
            <Image
              src="/assets/about/img/founderimage.png" // Replace with your actual path
              alt="Founder"
              width={400}
              height={400}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
