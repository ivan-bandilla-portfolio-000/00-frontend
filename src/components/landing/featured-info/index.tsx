import BentoGrid1 from '@/components/mvpblocks/bento-grid-1'
import BentoGrid2 from '@/components/mvpblocks/bento-grid-2'
import items from "./info"
import { SectionWrapper } from '@/hoc'

const FeaturedInfo = () => {


  return (
    <>
      <BentoGrid1 items={items} />
      <BentoGrid2 items={items} />

    </>
  )
}

export default SectionWrapper(FeaturedInfo, 'featured-info', { className: "" })