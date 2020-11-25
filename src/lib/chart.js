import 'd3-appendselect';

import * as d3 from 'd3';

import ChartComponent from './base/ChartComponent';

class TestingChart extends ChartComponent {
  defaultProps = {
    stroke: '#aaa',
    strokeWidth: 1,
    fill: 'steelblue',
    height: 400,
    margin: {
      left: 50,
      right: 50,
      top: 0,
      bottom: 30,
    },
    formatters: {
      caseTime: '%Y-%m-%d',
      testTime: '%Y-%m-%dT%H:%M:%S%Z',
      number: '.2s',
      date: '%B',
    },
    fills: {
      cases: 'rgba(255,255,255,.1)',
      tests: '#fce587'
    },
  };

  draw() {
    const data = this.data();
    const props = this.props();
    const node = this.selection().node();
    const { width } = node.getBoundingClientRect();
    const caseParse = d3.timeParse(props.formatters.caseTime);
    const testParse = d3.timeParse(props.formatters.testTime);
    const numberFormat = d3.format(props.formatters.number);
    const dateFormat = d3.timeFormat(props.formatters.date);

    const transition = d3.transition()
      .duration(750);

    const svg = this.selection()
      .appendSelect('svg') // see docs in ./utils/d3.js
      .attr('width', width)
      .attr('height', props.height)

    const g = svg.appendSelect('g.container')
      .attr('transform', `translate(${props.margin.left}, ${props.margin.top})`);

    for (let i = 0; i < data.cases.length; i++) {
      data.cases[i].parsedDate = caseParse(data.cases[i].date)
    }

    // for (let i = 0; i < data.tests.series.length; i++) {
    //   data.tests.series[i] = testParse(data.cases[i].date)
    // }

    const xScale = d3.scaleTime()
      .domain(d3.extent(data.cases, d => d.parsedDate))
      .range([0, width - props.margin.right - props.margin.left]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([props.height - props.margin.top - props.margin.bottom, 0]);

    const maxCases = d3.max(data.cases, d => d.count);
    const maxTests = d3.max(data.tests.test_dailycount, d => d ? d : 0);

    const areaCases = d3.line()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.count / maxCases))
      // .y0(yScale(0));

    const areaTests = d3.line()
      .x(function(d, i) {
        return xScale(testParse(data.tests.series[i]));
      })
      .y(function(d, i) {
        return yScale((data.tests.test_dailycount[i] ? data.tests.test_dailycount[i]:0) / maxTests)
      })
      // .y0(yScale(0));

    const yScaleCases = d3.scaleLinear()
      .domain([0, d3.max(data.cases, d => d.count)])
      .range([props.height - props.margin.top - props.margin.bottom, props.margin.top]);

    const yScaleTests = d3.scaleLinear()
      .domain([0, d3.max(data.tests.test_dailycount.filter(d => d))])
      .range([props.height - props.margin.top - props.margin.bottom, props.margin.top]);

    g.appendSelect('g.axis.axis--x')
      .attr('transform', `translate(0,${props.height - props.margin.top - props.margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(dateFormat));

    g.appendSelect('g.axis.axis--y.axis--y1')
      .call(d3.axisLeft(yScaleCases).tickFormat(numberFormat));

    g.appendSelect('g.axis.axis--y.axis--y2')
      .attr('transform', `translate(${width - props.margin.left - props.margin.right},0)`)
      .call(d3.axisRight(yScaleTests).tickFormat(numberFormat));

    g.appendSelect('path.case-area')
      .style('fill','none')
      .style('stroke', props.fills.cases)
      .attr('d', areaCases(data.cases));
    
    const numlist = []
    for (let i = 0; i<data.tests.series.length; i++) {
      numlist.push(i)
    }
    g.appendSelect('path.test-area')
      .style('fill','none')
      .style('stroke', props.fills.tests)
      .attr('d', areaTests(numlist));

    return this;
  }
}

export default TestingChart;
