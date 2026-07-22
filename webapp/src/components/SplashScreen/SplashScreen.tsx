import BotanicalSvg from '../../assets/botanical.svg'
import styles from './SplashScreen.module.css'

export interface ISplashScreenProps {
  visible: boolean
}

export function SplashScreen({ visible }: ISplashScreenProps) {
  if (!visible) return null

  return (
    <div className={styles.screen} data-testid="splash-screen">
      <div className={styles.inner}>
        <div className={styles.svgWrap}>
          <BotanicalSvg className={styles.svg} />
          <div className={styles.monogram} aria-label="fabrika.flo">
            f<span className={styles.monogramDot}>.</span>f
          </div>
        </div>
        <div className={styles.brand}>
          fabrika<span className={styles.brandAccent}>.</span>flo
        </div>
        <div className={styles.hairline} />
        <div className={styles.tagline}>цветочный цех</div>
      </div>
    </div>
  )
}
