import React from 'react'
import { graphql, useStaticQuery, Link } from 'gatsby'
import Img from 'gatsby-image'
import Container from '~components/common/container'
import { Row, Col } from '~components/common/grid'
import JumpState from './jump-state'
import datasetsStyle from './datasets.module.scss'

const Datasets = () => {
  const data = useStaticQuery(graphql`
    query {
      core: file(relativePath: { regex: "/dataset-core.png/" }) {
        relativePath
        childImageSharp {
          fluid(
            maxWidth: 900
            webpQuality: 70
            traceSVG: { color: "#E2D2CE" }
          ) {
            ...GatsbyImageSharpFluid_withWebp_tracedSVG
          }
        }
      }
      crdt: file(relativePath: { regex: "/dataset-crdt.png/" }) {
        relativePath
        childImageSharp {
          fluid(
            maxWidth: 900
            webpQuality: 70
            traceSVG: { color: "#E2D2CE" }
          ) {
            ...GatsbyImageSharpFluid_withWebp_tracedSVG
          }
        }
      }

      ltc: file(relativePath: { regex: "/dataset-ltc.png/" }) {
        relativePath
        childImageSharp {
          fluid(
            maxWidth: 900
            webpQuality: 70
            traceSVG: { color: "#E2D2CE" }
          ) {
            ...GatsbyImageSharpFluid_withWebp_tracedSVG
          }
        }
      }
    }
  `)
  return (
    <Container>
      <h2>Our datasets</h2>
      <Row className={datasetsStyle.datasets}>
        <Col width={[4, 4, 4]} paddingRight={[0, 0, 16]}>
          <Link to="/data">
            <Img fluid={data.core.childImageSharp.fluid} alt="" aria-hidden />
          </Link>
          <h3>
            <Link to="/data">Testing and outcomes</Link>
          </h3>
          <p>
            Every day, our volunteers compile the latest numbers on tests,
            cases, hospitalizations, and patient outcomes from every US state
            and territory.
          </p>
          <JumpState url={state => `/data/state/${state.childSlug.slug}`} />
        </Col>
        <Col width={[4, 4, 4]}>
          <Link to="/race">
            <Img fluid={data.crdt.childImageSharp.fluid} alt="" aria-hidden />
          </Link>
          <h3>
            <Link to="/race">Race and ethnicity</Link>
          </h3>
          <p>
            COVID-19 isn&apos;t affecting all communities equally. We&apos;ve
            partnered with the Boston University Center for Antiracist Research
            to collect the most complete racial data anywhere in the{' '}
            <Link to="/race">COVID Racial Data Tracker.</Link>
          </p>
          <JumpState
            url={state => `/race/dashboard/#state-${state.state.toLowerCase()}`}
          />
        </Col>
        <Col width={[4, 4, 4]} paddingLeft={[0, 0, 16]}>
          <Link to="/data/longtermcare">
            <Img fluid={data.ltc.childImageSharp.fluid} alt="" aria-hidden />
          </Link>
          <h3>
            <Link to="/data/longtermcare">Long-term care</Link>
          </h3>
          <p>
            The most comprehensive dataset about COVID-19 in US long-term care
            facilities. It compiles crucial data about the effects of the
            pandemic on a population with extraordinary vulnerabilities to the
            virus due to age, underlying health conditions, or proximity to
            large outbreaks.
          </p>
          <JumpState
            url={state => `/data/state/${state.childSlug.slug}/long-term-care`}
          />
        </Col>
      </Row>
    </Container>
  )
}
export default Datasets
