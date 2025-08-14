'use client';

import React from 'react';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { InjectionRecord, ProtocolSettings } from '@/lib/types';

interface ConstellationCanvasProps {
  records: InjectionRecord[];
  protocols: ProtocolSettings[];
}

function sketch(p5: P5CanvasInstance<ConstellationCanvasProps>) {
  let records: InjectionRecord[] = [];
  let protocols: ProtocolSettings[] = [];
  const starPositions: { x: number, y: number, color: string, size: number }[] = [];

  p5.updateWithProps = props => {
    if (props.records) {
      records = props.records.sort((a, b) => a.date.getTime() - b.date.getTime());
      updateStarPositions();
    }
    if (props.protocols) {
      protocols = props.protocols;
    }
  };

  const getProtocolForDate = (date: Date): ProtocolSettings | undefined => {
    return protocols
      .slice()
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .find(p => new Date(date) >= new Date(p.startDate));
  };

  const updateStarPositions = () => {
    starPositions.length = 0;
    if (records.length === 0) return;

    const dates = records.map(r => r.date.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const doses = records.map(r => r.dose);
    const minDose = Math.min(...doses);
    const maxDose = Math.max(...doses);

    records.forEach(record => {
      const protocol = getProtocolForDate(record.date);
      const color = protocol ? protocol.protocolColor : '#FFFFFF';
      const size = p5.map(record.dose, minDose, maxDose, 5, 15);
      const x = p5.map(record.date.getTime(), minDate, maxDate, 100, p5.width - 100);
      const y = p5.height / 2 + p5.random(-50, 50);
      starPositions.push({ x, y, color, size });
    });
  }

  p5.setup = () => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight);
    updateStarPositions();
  };

  p5.draw = () => {
    p5.background(0);

    // Draw nebula connections
    for (let i = 0; i < starPositions.length - 1; i++) {
      const star1 = starPositions[i];
      const star2 = starPositions[i+1];
      p5.stroke(star1.color);
      p5.strokeWeight(0.5);
      p5.line(star1.x, star1.y, star2.x, star2.y);
    }

    // Draw the stars
    starPositions.forEach(star => {
      const twinkle = p5.random(0.5, 1.5);
      p5.fill(star.color);
      p5.noStroke();
      p5.ellipse(star.x, star.y, star.size * twinkle, star.size * twinkle);
    });
  };
}

export default function ConstellationCanvas({ records, protocols }: ConstellationCanvasProps) {
  return <ReactP5Wrapper sketch={sketch} records={records} protocols={protocols} />;
}
