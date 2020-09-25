/* eslint-disable no-param-reassign,jsx-a11y/mouse-events-have-key-events */
import React, { useState, useMemo, useRef } from 'react'
import { useStaticQuery, graphql, navigate, Link } from 'gatsby'
import { geoPath, geoMercator } from 'd3-geo'
import slugify from 'slugify'
import classnames from 'classnames'
import stateShapes from '~data/visualization/states-hexgrid.json'
import usMapStyles from './us-map.module.scss'

const mapWidth = 900
const mapHeight = 540
const margin = {
  top: 0,
  left: 5,
  right: 5,
  bottom: 0,
}

const metrics = {
  sevenDayPositive: {
    title: {
      main: 'New daily COVID-19 cases reported by states and territories',
      subTitle: 'Seven-day rolling average',
    },
    getLimitClass: ({ sevenDayPositive }) => {
      if (sevenDayPositive <= 500) {
        return 100
      }
      if (sevenDayPositive <= 1000) {
        return 200
      }
      if (sevenDayPositive <= 5000) {
        return 700
      }
      return 1000
    },
    format: ({ sevenDayPositive }) => sevenDayPositive.toLocaleString(),
    reverseMobileOrder: true,
    levels: [
      {
        type: 100,
        className: [usMapStyles.levelBackground100, usMapStyles.levelText100],
        title: 'Below 500 cases',
        find: states =>
          states.filter(({ sevenDayPositive }) => sevenDayPositive < 500),
      },
      {
        type: 200,
        title: '500-1,000 cases',
        className: [usMapStyles.levelBackground200, usMapStyles.levelText200],
        find: states =>
          states.filter(
            ({ sevenDayPositive }) =>
              sevenDayPositive >= 500 && sevenDayPositive < 1000,
          ),
      },
      {
        type: 700,
        title: '1,000-5,000 cases',
        className: [usMapStyles.levelBackground700, usMapStyles.levelText700],
        find: states =>
          states.filter(
            ({ sevenDayPositive }) =>
              sevenDayPositive >= 1000 && sevenDayPositive < 5000,
          ),
      },
      {
        type: 1000,
        title: 'Over 5,000 cases',
        className: [usMapStyles.levelBackground1000, usMapStyles.levelText1000],
        find: states =>
          states.filter(({ sevenDayPositive }) => sevenDayPositive >= 5000),
      },
    ],
  },
  percentPositive: {
    title: {
      main: 'Percent-positive rate for US states and territories',
      subTitle:
        'Percentage of tests that came back positive over the past seven day',
    },
    getLimitClass: ({ percentPositive }) => {
      if (percentPositive < 0.03) {
        return 100
      }
      if (percentPositive < 0.1) {
        return 500
      }
      return 1000
    },
    reverseMobileOrder: true,
    format: ({ percentPositive }) =>
      percentPositive ? `${Math.round(percentPositive * 1000) / 10}%` : '0%',
    levels: [
      {
        type: 100,
        className: [usMapStyles.levelBackground100, usMapStyles.levelText100],
        title: 'Below 3% positive suppression goal',
        find: states =>
          states.filter(({ percentPositive }) => percentPositive < 0.03),
      },
      {
        type: 500,
        title: '3% - 10% positive mitigation goal',
        className: [usMapStyles.levelBackground500, usMapStyles.levelText500],
        find: states =>
          states.filter(
            ({ percentPositive }) =>
              percentPositive >= 0.03 && percentPositive < 0.1,
          ),
      },
      {
        type: 1000,
        title: 'Over 10% positive',
        className: [usMapStyles.levelBackground1000, usMapStyles.levelText1000],
        find: states =>
          states.filter(({ percentPositive }) => percentPositive > 0.1),
      },
    ],
  },
}

const State = ({
  feature,
  path,
  metric,
  onMouseEnter,
  isActive = false,
  isHovered = false,
}) => {
  const levelClass =
    usMapStyles[
      `levelBackground${metrics[metric].getLimitClass(
        feature.properties.stateInfo,
      )}`
    ]

  return (
    <path
      key={`path${feature.properties.state}`}
      d={path(feature)}
      className={classnames(
        usMapStyles.state,
        isActive && usMapStyles.active,
        isHovered && usMapStyles.hovered,
        levelClass,
      )}
      onClick={() => {
        navigate(feature.properties.stateInfo.link)
      }}
      onMouseEnter={onMouseEnter}
    />
  )
}

const Label = ({ feature, metric, path }) => {
  const centroid = path.centroid(feature)
  const levelClass =
    usMapStyles[
      `levelText${metrics[metric].getLimitClass(feature.properties.stateInfo)}`
    ]
  return (
    <>
      <text
        x={centroid[0] - 20}
        y={centroid[1]}
        className={classnames(
          usMapStyles.label,
          usMapStyles.stateLabel,
          levelClass,
        )}
        onClick={() => navigate(feature.properties.stateInfo.link)}
      >
        {feature.properties.stateInfo.state}
      </text>
      <text
        x={centroid[0] - 20}
        y={centroid[1] + 20}
        className={classnames(usMapStyles.label, levelClass)}
        onClick={() => navigate(feature.properties.stateInfo.link)}
      >
        {metrics[metric].format(feature.properties.stateInfo)}
      </text>
    </>
  )
}

const StateListStatistics = ({ title, states, className, metric }) => {
  if (!states || !states.length) {
    return null
  }
  return (
    <>
      <h3>{title}</h3>
      <div className={usMapStyles.list}>
        {states.map(state => (
          <div
            className={classnames(usMapStyles.state, className)}
            key={`stat-${state.state}`}
          >
            <Link to={state.link}>
              <div className={usMapStyles.name} aria-hidden>
                {state.state}
              </div>
              <span className="a11y-only">{state.name}</span>
              <div className={usMapStyles.number}>
                {metrics[metric].format(state)}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}

const StateList = ({ states, metric }) => {
  const list = metrics[metric].reverseMobileOrder
    ? [...metrics[metric].levels].reverse()
    : [...metrics[metric].levels]
  return (
    <div className={usMapStyles.stateList}>
      {list.map(({ type, title, className, find }) => (
        <StateListStatistics
          key={title}
          title={title}
          level={type}
          metric={metric}
          className={className}
          states={find(states)}
        />
      ))}
    </div>
  )
}

const getAverage = (history, field) =>
  history.reduce((total, item) => total + item[field], 0) / history.length

const MapLegendItem = ({ title, className }) => (
  <div className={usMapStyles.item}>
    <div className={classnames(usMapStyles.bar, className)} />
    {title}
  </div>
)

const MapLegend = ({ metric }) => {
  const list = metrics[metric].reverseMobileOrder
    ? [...metrics[metric].levels]
    : [...metrics[metric].levels].reverse()
  return (
    <div className={usMapStyles.legend} aria-hidden>
      {list.map(({ title, type }) => (
        <MapLegendItem
          title={title}
          key={title}
          className={usMapStyles[`levelBackground${type}`]}
        />
      ))}
    </div>
  )
}

const Map = ({ metric }) => {
  const [activeState, setActiveState] = useState(false)
  const [hoveredState, setHoveredState] = useState(false)
  const mapRef = useRef(false)
  const path = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [margin.left, margin.top],
        [mapWidth - margin.right, mapHeight - margin.bottom],
      ],
      stateShapes,
    )
    return geoPath().projection(projection)
  }, [mapWidth, mapHeight])

  const setStateNeighbor = direction => {
    const { neighbors } = stateShapes.features[
      activeState !== false ? activeState : 0
    ].properties
    if (neighbors && neighbors[direction] !== false) {
      setActiveState(
        stateShapes.features.findIndex(
          feature => feature.properties.state === neighbors[direction],
        ),
      )
    }
  }

  return (
    <>
      {activeState !== false && (
        <div className={usMapStyles.instructions}>
          Use <strong>Escape</strong> to skip this map,{' '}
          <strong>arrow keys</strong> to navigate, and <strong>Enter</strong> to
          select a state.
        </div>
      )}
      <svg
        ref={mapRef}
        className={usMapStyles.map}
        width={mapWidth}
        height={mapHeight}
        tabIndex="0"
        aria-hidden
        onMouseOut={() => setActiveState(false)}
        onBlur={() => setActiveState(false)}
        onFocus={() => {
          setActiveState(0)
        }}
        onKeyDown={event => {
          event.preventDefault()
          if (event.key === 'Escape') {
            mapRef.current.blur()
          }
          if (event.key === 'Tab' || event.key === 'ArrowRight') {
            setStateNeighbor('e')
          }
          if (
            (event.shiftKey && event.key === 'Tab') ||
            event.key === 'ArrowLeft'
          ) {
            setStateNeighbor('w')
          }
          if (event.key === 'ArrowDown') {
            setStateNeighbor('s')
          }
          if (event.key === 'ArrowUp') {
            setStateNeighbor('n')
          }
          if (event.key === 'Enter') {
            if (activeState === false) {
              return
            }
            navigate(
              stateShapes.features[activeState].properties.stateInfo.link,
            )
          }
        }}
      >
        <g>
          {stateShapes.features.map(feature => (
            <State
              key={`state-${feature.properties.state}`}
              feature={feature}
              path={path}
              metric={metric}
              onMouseEnter={() => {
                setHoveredState(feature)
              }}
            />
          ))}
        </g>
        <g>
          {stateShapes.features.map(feature => (
            <Label
              key={`label-${feature.properties.state}`}
              feature={feature}
              path={path}
              metric={metric}
            />
          ))}
        </g>
        {activeState !== false && (
          <g>
            <State
              feature={stateShapes.features[activeState]}
              path={path}
              metric={metric}
              isActive
            />
            <Label
              feature={stateShapes.features[activeState]}
              path={path}
              metric={metric}
            />
          </g>
        )}
        {hoveredState !== false && (
          <g
            onMouseLeave={() => {
              setHoveredState(false)
            }}
          >
            <State
              feature={hoveredState}
              path={path}
              metric={metric}
              isHovered
            />
            <Label feature={hoveredState} path={path} metric={metric} />
          </g>
        )}
      </svg>
      <MapLegend metric={metric} />
    </>
  )
}

export default () => {
  const [metric, setMetric] = useState('sevenDayPositive')
  const data = useStaticQuery(graphql`
    {
      allCovidStateInfo {
        nodes {
          name
          state
        }
      }
      allCovidStateDaily(sort: { fields: [state, date], order: [ASC, DESC] }) {
        group(field: state, limit: 7) {
          nodes {
            state
            positiveIncrease
            negativeIncrease
            childPopulation {
              population
            }
          }
        }
      }
      casesMessage: contentfulSnippet(slug: { eq: "homepage-map-cases" }) {
        contentful_id
        childContentfulSnippetContentTextNode {
          childMarkdownRemark {
            html
          }
        }
      }
      percentPositiveMessage: contentfulSnippet(
        slug: { eq: "homepage-map-percent-positive" }
      ) {
        contentful_id
        childContentfulSnippetContentTextNode {
          childMarkdownRemark {
            html
          }
        }
      }
    }
  `)

  const metricMessages = {
    sevenDayPositive: 'casesMessage',
    percentPositive: 'percentPositiveMessage',
  }

  const states = []
  data.allCovidStateInfo.nodes.forEach(state => {
    const { nodes } = data.allCovidStateDaily.group.find(
      group => group.nodes[0].state === state.state,
    )
    const stateInfo = nodes.map(node => {
      node.posNegIncrease = node.positiveIncrease + node.negativeIncrease
      node.percentPositive = node.positiveIncrease / node.posNegIncrease
      return node
    })

    states.push({
      ...state,
      sevenDayPositive: Math.round(getAverage(stateInfo, 'positiveIncrease')),

      percentPositive:
        stateInfo.reduce(
          (positive, posNegState) => posNegState.positiveIncrease + positive,
          0,
        ) /
        stateInfo.reduce(
          (posNeg, posNegState) =>
            posNegState.positiveIncrease +
            posNegState.negativeIncrease +
            posNeg,
          0,
        ),
      link: `/data/state/${slugify(state.name, {
        strict: true,
        lower: true,
      })}`,
    })
  })

  stateShapes.features.forEach(feature => {
    feature.properties.stateInfo = states.find(
      state => state.state === feature.properties.state,
    )
  })

  return (
    <div className={usMapStyles.mapWrapper}>
      <h1>COVID-19 in the US</h1>
      <a href="#skip-map" className={usMapStyles.skipMap}>
        Skip map &amp; list of states
      </a>
      <div className={usMapStyles.toggle}>
        <button
          type="button"
          data-active={metric === 'sevenDayPositive' ? true : undefined}
          onClick={event => {
            event.preventDefault()
            setMetric('sevenDayPositive')
          }}
        >
          Cases
        </button>
        <button
          type="button"
          data-active={metric === 'percentPositive' ? true : undefined}
          onClick={event => {
            event.preventDefault()
            setMetric('percentPositive')
          }}
        >
          Percent positive
        </button>
      </div>

      <h2 className={usMapStyles.mapHeading} aria-live="polite">
        {metrics[metric].title.main}
        <div>{metrics[metric].title.subTitle}</div>
      </h2>
      <Map metric={metric} />
      <StateList states={states} metric={metric} />
      <div
        className={usMapStyles.note}
        dangerouslySetInnerHTML={{
          __html:
            data[metricMessages[metric]].childContentfulSnippetContentTextNode
              .childMarkdownRemark.html,
        }}
      />
      <div id="skip-map" />
    </div>
  )
}