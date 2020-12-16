import 'd3-appendselect';

import * as d3 from 'd3';

import ChartComponent from './base/ChartComponent';

class TestingChart extends ChartComponent {
  defaultProps = {
    stroke: '#aaa',
    strokeWidth: 1,
    fill: 'steelblue',
    height: 300,
    margin: {
      left: 50,
      right: 50,
      top: 50,
      bottom: 50,
    },
    formatters: {
      caseTime: '%Y-%m-%d',
      testTime: '%Y-%m-%dT%H:%M:%S%Z',
      number: '.2s',
      date: '%B',
    },
    padding: 1,
    fills: {
      cases: 'rgba(255,255,255,.5)',
      tests: '#fce587',
      recommended: 'rgba(255,255,255,.3)'
    },
    maxLim: .5,
    avg_days: 7,
    recommended: .05,
    labelBreaks: .1
  };

  draw() {
    const data = this.data();
    const props = this.props();
    const node = this.selection().node();
    const { width } = node.getBoundingClientRect();
    const rScale = d3.scaleSqrt()
      .range([1,30])
      .domain([1,d3.max(data, d=>d.testMeans.currentMean.mean)])

    const transition = d3.transition()
      .duration(750);

    const svg = this.selection()
      .appendSelect('svg') // see docs in ./utils/d3.js
      .attr('width', width)
      .attr('height', props.height)

    // const scaleX = d3.scaleLinear()
    //   .domain(this.minMax)
    //   .range([this.margin.left, this.width]);
    const scaleX = d3.scaleLinear()
      .domain([0, props.maxLim])
      .range([0,width - props.margin.left - props.margin.right]);

    const g = svg.appendSelect('g.container')
      .attr('transform', `translate(${props.margin.left}, ${props.margin.top})`);

    g.appendSelect('line.recommended')
      .attr('x1', scaleX(props.recommended))
      .attr('x2', scaleX(props.recommended))
      .attr('y1', 0)
      .attr('y2', props.height-props.margin.top)
      .style('stroke',props.fills.recommended)

    const circles = g.appendSelect('g.nodes')
      .selectAll('circle')
      .data(data, (d, i) => i);

    const simulation = d3.forceSimulation(data)
      .force('x', d3.forceX(d => scaleX(d.positivityRate[2])))
      .force('y', d3.forceY(props.height/2))
      .force('collide', d3.forceCollide(d=>rScale(d.testMeans.currentMean.mean)+props.padding))
      .stop();

    for (var i = 0; i < 500; ++i) simulation.tick();

    circles.enter().append('circle')
      .style('fill', (d) => {
        if (d.positivityRate[2] > d.positivityRate[1] && d.positivityRate[1]>d.positivityRate[0]) {
          return '#EE665B';
        } else if (d.positivityRate[2] < d.positivityRate[1] && d.positivityRate[1]<d.positivityRate[0]) {
          return '#74C476';
        } else {
          return 'rgba(255,255,255,.8)';
        }
      })
      .attr('cx', d=> d.x)
      .attr('cy', d=> d.y)
      .merge(circles)
      .attr('id', d => d.id)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => rScale(d.testMeans.currentMean.mean))
      .on('click', (d) => {console.log(d) });

    circles.exit()
      .attr('r', 0)
      .remove();

    g.appendSelect('g.axis.axis--x')
      .call(d3.axisTop(scaleX))
    return this;
  }
}

export default TestingChart;
