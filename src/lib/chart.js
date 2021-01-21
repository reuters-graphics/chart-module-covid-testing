import 'd3-appendselect';

import * as d3 from 'd3';

import ChartComponent from './base/ChartComponent';
import Mustache from 'mustache';
import { throttle } from 'lodash';

class TestingChart extends ChartComponent {
  defaultProps = {
    height: 400,
    margin: {
      left: 50,
      right: 50,
      top: 10,
      bottom: 30,
    },
    range: {
      startDate: '2020-03-01',
    },
    formatters: {
      caseTime: '%Y-%m-%d',
      date: '%B',
      date_tooltip: '%B %e',
      tooltipNumberFormatter: d => d3.format(',')(d),
      tooltipDateFormatter: d => d3.timeFormat("%b %e, %Y")(d),
    },
    labels: true,
    fills: {
      tests: '#eec331',
      refbox: 'rgba(255,255,255,.1)',
      label: 'rgba(255,255,255,.9)',
    },
    tooltip_default: 'top', // other options auto or bottom
    avg_days: 7,
    refBox: { y1: 0, y2: 5 },
    refLabel: {
      text: 'W.H.O. recommendation'
    },
    lineThickness: 2,
    text: {
      avg: '{{ average }}-day average',
      tooltip: 'Positivity rate of {{ rate }}% with a 7-day average of {{ cases }} cases and {{ tests }} tests'
    }
  };

  draw() {
    const data = this.data();
    const props = this.props();
    const node = this.selection().node();
    const { width } = node.getBoundingClientRect();
    const caseParse = d3.timeParse(props.formatters.caseTime);
    const dateFormat = d3.timeFormat(props.formatters.date);
    const dateFormatMatch = d3.timeFormat('%Y-%m-%d');

    const transition = d3.transition()
      .duration(750);

    const svg = this.selection()
      .appendSelect('svg') // see docs in ./utils/d3.js
      .attr('width', width)
      .attr('height', props.height)

    const g = svg.appendSelect('g.container')
      .attr('transform', `translate(${props.margin.left}, ${props.margin.top})`);

    data.cases = data.cases.sort((a, b) => (d3.descending(caseParse(a.date), caseParse(b.date))));
    data.tests = data.tests.sort((a, b) => (d3.descending(caseParse(a.date), caseParse(b.date))));

    for (let i = 0; i < data.cases.length; i++) {
      data.cases[i].parsedDate = caseParse(data.cases[i].date);
      data.cases[i].mean = d3.mean(data.cases.slice(i, (i + props.avg_days)), d => +d.count < 0 ? 0 : d.count); // avg calc
    }

    for (let i = 0; i < data.tests.length; i++) {
      data.tests[i].parsedDate = caseParse(data.tests[i].date);
      data.tests[i].mean = d3.mean(data.tests.slice(i, (i + props.avg_days)), d => +d.count < 0 ? 0 : d.count); // avg calc
    }

    for (let i = 0; i < data.tests.length; i++) {
      let caseNum = data.cases.filter(d=> d.date === data.tests[i].date)[0];
      if (caseNum) {
        data.tests[i].caseMean = caseNum.mean;
        data.tests[i].posRate = data.tests[i].caseMean/data.tests[i].mean * 100;
      }
    }

    const parsedStartDate = caseParse(props.range.startDate);

    data.tests = data.tests.filter(d=>d.posRate && d.parsedDate >= parsedStartDate)

    const xScale = d3.scaleTime()
      .domain(d3.extent(data.tests, d => d.parsedDate))
      .range([0, width - props.margin.right - props.margin.left]);

    let maxY = d3.max(data.tests, d=>d.posRate)
    maxY = maxY<8?8:maxY
    const yScale = d3.scaleLinear()
      .domain([maxY,0])
      .range([0,props.height - props.margin.top - props.margin.bottom]);

    const lineTests = d3.line()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.posRate));

    g.appendSelect('g.axis.axis--x')
      .attr('transform', `translate(0,${props.height - props.margin.top - props.margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(dateFormat));

    const yAxis = g.appendSelect('g.axis.axis--y.axis--y1')
      .attr('transform', `translate(${width - props.margin.left - props.margin.right},0)`)
      .call(d3.axisRight(yScale).ticks(5).tickFormat((d,i)=>i==0?`${d}%`:d));

    g.appendSelect('rect.refBox')
      .style('fill', props.fills.refbox)
      .attr('x', 0)
      .attr('width', width - props.margin.left - props.margin.right)
      .attr('y', yScale(props.refBox.y2))
      .attr('height', yScale(props.refBox.y1) - yScale(props.refBox.y2));

    g.appendSelect('path.test-area')
      .style('fill', 'none')
      .style('stroke', props.fills.tests)
      .style('stroke-width', props.lineThickness)
      .attr('d', lineTests(data.tests));

    const labelG = g.appendSelect('g.ref-label')
      .appendSelect('text')
      .style('fill', props.fills.label)
      .text(props.refLabel.text);

    if (data.tests[0].posRate >= 2) {
      labelG.attr('transform', `translate(${(width - props.margin.left - props.margin.right) - 10},${(props.height - props.margin.top - props.margin.bottom) * .96})`)
        .style('text-anchor', 'end');
    } else if (data.tests[0].posRate<5) {
      labelG.attr('transform', `translate(${(width - props.margin.left - props.margin.right) - 10},${yScale(5.2)})`)
        .style('text-anchor', 'end');
    } else {
      labelG.attr('transform', `translate(${(width - props.margin.left - props.margin.right) - 10},${(props.height-props.margin.top-props.margin.bottom)*.5})`)
        .style('text-anchor', 'end');
    }

    const touchBox = g.appendSelect('g.dummy-container')
      .appendSelect('rect')
      .attr('height', props.height - props.margin.top)
      .attr('width', width - props.margin.left - props.margin.right + 2)
      .style('opacity', 0);

    touchBox.on('mouseover mousemove touchenter touchstart touchmove', throttle(() => {
      if (!d3.event) return;
      const coordinates = d3.mouse(g.node());
      const highlightDate = (dateFormatMatch(new Date(xScale.invert(coordinates[0]))));
      const obj = data.tests.filter(d => dateFormatMatch(d.parsedDate) === highlightDate)[0];
      if (highlightDate && obj) {
        showTooltip(highlightDate, obj);
      }
    }, 50), true);

    touchBox.on('mouseout touchleave touchcancel', hideTooltip);

    if (props.labels) {
      const labelContainer = g.appendSelect('g.labels');
      const useDay = data.tests.length/2;
      let anchor = 'middle';
      const labelX = xScale(data.tests[useDay].date);
      if (labelX < ((width) * 0.18)) {
        anchor = 'start';
      }
      // avg label
      const avgLabel = labelContainer.appendSelect('g.avg-label')
        .attr('transform', `translate(${xScale(data.tests[useDay].parsedDate)},${yScale(data.tests[useDay].posRate) - props.height / 20})`);

      avgLabel.appendSelect('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', props.height / 20)
        .attr('y2', 0);

      avgLabel.appendSelect('text')
        .attr('dx', -10)
        .attr('dy', -5)
        .style('text-anchor', anchor)
        .text(Mustache.render(props.text.avg, { average: props.avg_days }));

      // new numbers label
    } else {
      g.select('g.labels')
        .remove();
    }

    // tooltip
    const tooltipBox = this.selection()
      .appendSelect('div.custom-tooltip');

    const ttInner = tooltipBox.appendSelect('div.tooltip-inner');

    function showTooltip(date, obj) {
      g.select('.labels').style('opacity', 0)

      const coords = [];

      coords[0] = xScale(obj.parsedDate) + props.margin.left;
      coords[1] = yScale(obj.posRate) + props.margin.top;

      const q = getTooltipType(coords, [props.height, width]);

      tooltipBox.classed('tooltip-active', true)
        .classed('tooltip-ne tooltip-s tooltip-n tooltip-sw tooltip-nw tooltip-se', false)
        .style('left', `${coords[0]}px`)
        .style('top', `${coords[1]}px`)
        .classed(`tooltip-${q}`, true);

      ttInner.appendSelect('div.tt-header')
        .text(props.formatters.tooltipDateFormatter(obj.parsedDate));

      ttInner.appendSelect('div.tt-row')
        .text(Mustache.render(props.text.tooltip, { rate: Math.floor(obj.posRate), cases: props.formatters.tooltipNumberFormatter(Math.floor(obj.caseMean)), tests: props.formatters.tooltipNumberFormatter(Math.floor(obj.mean))}));
    }

    function hideTooltip() {
      g.select('.labels').style('opacity', 1);
      g.select('.highlight-bar')
        .attr('height', d => props.height)
        .attr('y', d => 0)
        .style('opacity', 0)
        .classed('active', false);

      tooltipBox.classed('tooltip-active', false);
    }

    function getTooltipType(coords, size) {
      const l = [];
      const ns_threshold = 4;

      if (props.tooltip_default == 'top') {
        l.push('s');
      } else if (props.tooltip_default == 'bottom') {
        l.push('n');
      } else {
        if (coords[1] > size[1] / ns_threshold) {
          l.push('s');
        } else {
          l.push('n');
        }
      }

      if (coords[0] > size[0] / 2) {
        l.push('e');
      }

      if (coords[0] < size[0] / 2) {
        l.push('w');
      }

      return l.join('');
    }

    return this;
  }
}

export default TestingChart;
