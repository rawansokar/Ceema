import { useState, useEffect } from 'react'
import { getAllNews } from '../../services/newsService'
import Layout from '../../components/Layout/Layout'
import styles from './News.module.css'

const CATEGORY_LABELS = {
  movies: 'Box Office',
  tv: 'TV News',
  industry: 'Industry News',
  features: 'Features',
  marvel: 'Marvel',
}

const formatDate = (iso) => {
  if (!iso) return ''

  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const News = () => {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const allData = await getAllNews()

      setNews(allData)

      setLoading(false)
    }

    load()
  }, [])

  return (
    <Layout>
      <div className={styles.newsPage}>

        <div className={styles.heroBanner}>
          <div className={styles.heroOverlay} />

          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Industry News
            </h1>
          </div>
        </div>

        <div className={styles.inner}>

          {loading && (
            <div className={styles.loadingState}>
              Loading news...
            </div>
          )}

          {!loading && (
            <div className={styles.newsLayout}>

              <div className={styles.mainArticles}>

                {news.map((article) => (
                  <div
                    key={article.id}
                    className={styles.articleCard}
                  >

                    <div className={styles.articleImageWrap}>

                      <img
                        src={article.image_url}
                        alt={article.title}
                        className={styles.articleImage}
                        onError={(e) => {
                          e.target.src =
                            `https://placehold.co/300x200/1a1a1a/cc0000?text=${encodeURIComponent(article.category)}`
                        }}
                      />

                    </div>

                    <div className={styles.articleInfo}>

                      <span className={styles.articleCategory}>
                        {CATEGORY_LABELS[article.category] || article.category}
                      </span>

                      <h3 className={styles.articleTitle}>
                        {article.title}
                      </h3>

                      <p className={styles.articleExcerpt}>
                        {article.summary}
                      </p>

                      <div className={styles.articleMeta}>

                        <span className={styles.articleDate}>
                          {formatDate(article.published_at)}
                        </span>

                        {article.source_url && (
                          <a
                            href={article.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.readMoreBtn}
                          >
                            Read More
                          </a>
                        )}

                      </div>

                    </div>

                  </div>
                ))}

                {news.length === 0 && (
                  <div className={styles.emptyState}>
                    No articles found.
                  </div>
                )}

              </div>

              <div className={styles.newsSidebar}>

                <div className={styles.sidebarCard}>

                  <h3 className={styles.sidebarTitle}>
                    Latest Headlines
                  </h3>

                  <div className={styles.headlinesList}>

                    {news.slice(0, 5).map((article) => (
                      <div
                        key={article.id}
                        className={styles.headlineItem}
                      >

                        <span className={styles.headlineDot} />

                        <div className={styles.headlineInfo}>

                          <p className={styles.headlineTitle}>
                            {article.title}
                          </p>

                          <span className={styles.headlineDate}>
                            {formatDate(article.published_at)}
                          </span>

                        </div>

                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </Layout>
  )
}

export default News