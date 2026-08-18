import { addPropertyControls, ControlType } from "framer"
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from "react"

/** Skillpath courses section — Framer code component */

const BASE_URL = "https://syncsphere-hiv6.onrender.com"
const COURSES_URL = `${BASE_URL}/assignment/course-data`
const COUNTRY_URL = `${BASE_URL}/assignment/country-code`

/** Used only when courses load but country detection fails. */
const FALLBACK_COUNTRY = "IN" as const

type CountryCode = "IN" | "US"

type Course = {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

type SortOption = "default" | "price-asc" | "price-desc"

type Props = {
    sectionTitle: string
    accentColor: string
    width?: number
    height?: number
}

type LoadState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "empty" }
    | {
          status: "ready"
          courses: Course[]
          country: CountryCode
          /** True when we guessed currency because /country-code failed. */
          usedFallbackCurrency: boolean
      }

function formatPrice(course: Course, country: CountryCode): string {
    if (country === "IN") {
        // API sends paise (1/100 of a rupee). 199900 → ₹1,999
        const rupees = course.pricePaise / 100
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(rupees)
    }

    // API sends USD cents. 3999 → $39.99
    const dollars = course.priceUsdCents / 100
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(dollars)
}

function priceValue(course: Course, country: CountryCode): number {
    return country === "IN" ? course.pricePaise : course.priceUsdCents
}

function parseCountry(data: unknown): CountryCode | null {
    if (
        typeof data === "object" &&
        data !== null &&
        "country_code" in data &&
        ((data as { country_code: unknown }).country_code === "IN" ||
            (data as { country_code: unknown }).country_code === "US")
    ) {
        return (data as { country_code: CountryCode }).country_code
    }
    return null
}

async function fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, { method: "GET" })

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
    }

    return response.json()
}

/**
 * Courses can succeed while country fails. We still render the grid and
 * fall back to INR with a visible notice — silent wrong currency is worse.
 */
async function loadCoursesSection(): Promise<LoadState> {
    const [coursesResult, countryResult] = await Promise.allSettled([
        fetchJson(COURSES_URL),
        fetchJson(COUNTRY_URL),
    ])

    if (coursesResult.status === "rejected") {
        return {
            status: "error",
            message: "We couldn't load courses right now. Please try again.",
        }
    }

    const courses = coursesResult.value
    if (!Array.isArray(courses)) {
        return {
            status: "error",
            message: "Courses came back in an unexpected format.",
        }
    }

    if (courses.length === 0) {
        return { status: "empty" }
    }

    let country: CountryCode = FALLBACK_COUNTRY
    let usedFallbackCurrency = true

    if (countryResult.status === "fulfilled") {
        const parsed = parseCountry(countryResult.value)
        if (parsed) {
            country = parsed
            usedFallbackCurrency = false
        }
    }

    return {
        status: "ready",
        courses: courses as Course[],
        country,
        usedFallbackCurrency,
    }
}

export default function CoursesSection(props: Props) {
    const {
        sectionTitle = "Courses",
        accentColor = "#0F766E",
    } = props

    const [state, setState] = useState<LoadState>({ status: "loading" })
    const [query, setQuery] = useState("")
    const [sort, setSort] = useState<SortOption>("default")
    const [reloadKey, setReloadKey] = useState(0)

    const retry = useCallback(() => {
        setQuery("")
        setSort("default")
        setState({ status: "loading" })
        setReloadKey((key) => key + 1)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function run() {
            setState({ status: "loading" })
            try {
                const next = await loadCoursesSection()
                if (!cancelled) setState(next)
            } catch {
                if (!cancelled) {
                    setState({
                        status: "error",
                        message:
                            "Something went wrong while loading courses. Please try again.",
                    })
                }
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [reloadKey])

    const visibleCourses = useMemo(() => {
        if (state.status !== "ready") return []

        const normalized = query.trim().toLowerCase()
        let list = state.courses

        if (normalized) {
            list = list.filter((course) => {
                const haystack = [
                    course.courseName,
                    course.description,
                    course.mainCategory,
                    course.shortCourse,
                    course.courseType,
                ]
                    .join(" ")
                    .toLowerCase()
                return haystack.includes(normalized)
            })
        }

        if (sort === "price-asc") {
            list = [...list].sort(
                (a, b) =>
                    priceValue(a, state.country) - priceValue(b, state.country)
            )
        } else if (sort === "price-desc") {
            list = [...list].sort(
                (a, b) =>
                    priceValue(b, state.country) - priceValue(a, state.country)
            )
        }

        return list
    }, [state, query, sort])

    return (
        <div style={styles.root} data-framer-name="Skillpath Courses">
            <style>{css}</style>

            <div style={styles.headerRow}>
                <h2 style={styles.title}>{sectionTitle}</h2>
                {state.status === "ready" && (
                    <span style={styles.count}>
                        {visibleCourses.length} of {state.courses.length}
                    </span>
                )}
            </div>

            {state.status === "ready" && state.usedFallbackCurrency && (
                <p style={{ ...styles.banner, borderColor: accentColor }}>
                    We couldn't detect your region, so prices are shown in INR.
                    Refresh to try again.
                </p>
            )}

            {(state.status === "ready" || state.status === "loading") && (
                <div style={styles.toolbar}>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search courses"
                        aria-label="Search courses"
                        disabled={state.status !== "ready"}
                        style={styles.search}
                    />
                    <select
                        value={sort}
                        onChange={(event) =>
                            setSort(event.target.value as SortOption)
                        }
                        aria-label="Sort by price"
                        disabled={state.status !== "ready"}
                        style={styles.select}
                    >
                        <option value="default">Default order</option>
                        <option value="price-asc">Price: low to high</option>
                        <option value="price-desc">Price: high to low</option>
                    </select>
                </div>
            )}

            {state.status === "loading" && (
                <div
                    className="sp-container"
                    aria-busy="true"
                    aria-live="polite"
                >
                    <div className="sp-grid">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <SkeletonCard key={index} />
                        ))}
                    </div>
                </div>
            )}

            {state.status === "error" && (
                <div style={styles.stateBox} role="alert">
                    <p style={styles.stateTitle}>Couldn't load courses</p>
                    <p style={styles.stateBody}>{state.message}</p>
                    <button
                        type="button"
                        onClick={retry}
                        style={{
                            ...styles.button,
                            backgroundColor: accentColor,
                        }}
                    >
                        Try again
                    </button>
                </div>
            )}

            {state.status === "empty" && (
                <div style={styles.stateBox}>
                    <p style={styles.stateTitle}>No courses yet</p>
                    <p style={styles.stateBody}>
                        Nothing came back from the catalog. Check again in a
                        moment.
                    </p>
                    <button
                        type="button"
                        onClick={retry}
                        style={{
                            ...styles.button,
                            backgroundColor: accentColor,
                        }}
                    >
                        Refresh
                    </button>
                </div>
            )}

            {state.status === "ready" && visibleCourses.length === 0 && (
                <div style={styles.stateBox}>
                    <p style={styles.stateTitle}>No matches</p>
                    <p style={styles.stateBody}>
                        Nothing matched “{query}”. Try a different search.
                    </p>
                </div>
            )}

            {state.status === "ready" && visibleCourses.length > 0 && (
                <div className="sp-container">
                    <div className="sp-grid">
                        {visibleCourses.map((course) => (
                            <article
                                key={course.courseCode || course.mangoId}
                                className="sp-card"
                            >
                                <div style={styles.cardTop}>
                                    <span
                                        style={{
                                            ...styles.category,
                                            color: accentColor,
                                            backgroundColor: hexToRgba(
                                                accentColor,
                                                0.1
                                            ),
                                        }}
                                    >
                                        {course.mainCategory}
                                    </span>
                                    {course.refundable && (
                                        <span style={styles.badge}>
                                            Refundable
                                        </span>
                                    )}
                                </div>

                                <h3 style={styles.courseName}>
                                    {course.courseName}
                                </h3>
                                <p className="sp-description">
                                    {course.description}
                                </p>
                                <p style={styles.price}>
                                    {formatPrice(course, state.country)}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="sp-card sp-skeleton" aria-hidden="true">
            <div className="sp-skel sp-skel-chip" />
            <div className="sp-skel sp-skel-title" />
            <div className="sp-skel sp-skel-line" />
            <div className="sp-skel sp-skel-line short" />
            <div className="sp-skel sp-skel-price" />
        </div>
    )
}

function hexToRgba(hex: string, alpha: number): string {
    const cleaned = hex.replace("#", "")
    if (cleaned.length !== 3 && cleaned.length !== 6) {
        return `rgba(15, 118, 110, ${alpha})`
    }

    const full =
        cleaned.length === 3
            ? cleaned
                  .split("")
                  .map((char) => char + char)
                  .join("")
            : cleaned

    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const styles: Record<string, CSSProperties> = {
    root: {
        width: "100%",
        boxSizing: "border-box",
        padding: 24,
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#14212B",
        background:
            "linear-gradient(180deg, #F7FAF9 0%, #EEF3F1 100%)",
        borderRadius: 16,
    },
    headerRow: {
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
    },
    title: {
        margin: 0,
        fontSize: 28,
        lineHeight: 1.2,
        fontWeight: 700,
        letterSpacing: "-0.02em",
    },
    count: {
        fontSize: 13,
        color: "#5B6B75",
        whiteSpace: "nowrap",
    },
    banner: {
        margin: "0 0 16px",
        padding: "10px 12px",
        fontSize: 13,
        lineHeight: 1.4,
        color: "#3A4A54",
        backgroundColor: "#FFFFFF",
        border: "1px solid",
        borderRadius: 10,
    },
    toolbar: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 18,
    },
    search: {
        flex: "1 1 220px",
        minWidth: 0,
        height: 42,
        padding: "0 12px",
        borderRadius: 10,
        border: "1px solid #D5DEE3",
        backgroundColor: "#FFFFFF",
        fontSize: 14,
        outline: "none",
    },
    select: {
        flex: "0 1 180px",
        height: 42,
        padding: "0 12px",
        borderRadius: 10,
        border: "1px solid #D5DEE3",
        backgroundColor: "#FFFFFF",
        fontSize: 14,
        outline: "none",
    },
    stateBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        padding: 24,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        border: "1px solid #DDE5EA",
    },
    stateTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 650,
    },
    stateBody: {
        margin: 0,
        fontSize: 14,
        lineHeight: 1.5,
        color: "#5B6B75",
    },
    button: {
        marginTop: 8,
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },
    cardTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 12,
    },
    category: {
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.2,
    },
    badge: {
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 650,
        lineHeight: 1.2,
        color: "#166534",
        backgroundColor: "#DCFCE7",
    },
    courseName: {
        margin: "0 0 8px",
        fontSize: 18,
        lineHeight: 1.3,
        fontWeight: 700,
        letterSpacing: "-0.01em",
    },
    price: {
        margin: "14px 0 0",
        fontSize: 18,
        fontWeight: 700,
        color: "#0B1220",
    },
}

const css = `
/* Size the grid from the component width (Framer frame), not only the viewport. */
.sp-container {
  width: 100%;
  container-type: inline-size;
  container-name: skillpath-courses;
}

.sp-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  width: 100%;
}

@container skillpath-courses (min-width: 640px) {
  .sp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@container skillpath-courses (min-width: 980px) {
  .sp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@supports not (container-type: inline-size) {
  @media (min-width: 640px) {
    .sp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: 980px) {
    .sp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
}

.sp-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #dbe3e8;
  box-shadow: 0 1px 0 rgba(20, 33, 43, 0.03);
}

.sp-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: #5b6b75;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.sp-skeleton {
  min-height: 168px;
}

.sp-skel {
  border-radius: 8px;
  background: linear-gradient(90deg, #e8eef1 0%, #f5f8f9 50%, #e8eef1 100%);
  background-size: 200% 100%;
  animation: sp-shimmer 1.2s ease-in-out infinite;
}

.sp-skel-chip { width: 88px; height: 22px; margin-bottom: 14px; }
.sp-skel-title { width: 70%; height: 20px; margin-bottom: 12px; }
.sp-skel-line { width: 100%; height: 12px; margin-bottom: 8px; }
.sp-skel-line.short { width: 62%; }
.sp-skel-price { width: 40%; height: 18px; margin-top: 18px; }

@keyframes sp-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
`

CoursesSection.defaultProps = {
    sectionTitle: "Courses",
    accentColor: "#0F766E",
}

addPropertyControls(CoursesSection, {
    sectionTitle: {
        type: ControlType.String,
        title: "Title",
        placeholder: "Courses",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0F766E",
    },
})
