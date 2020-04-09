import config from '../config'
import * as assets from './neuron-assets'
import Math2 from '../engine/math-2'

const defaultOpts = {
	radius: 3.4,
	clinginess: 8,
}

function jiggle( x ) {
	return Math.sin( 5 * x * Math.PI ) / ( 0.7 * x ) * 0.06
}

function drawGauge( ctx, neuron ) {
	const tau = Math.PI * 2
	const gaugeStart = tau / 4 // down
	const innerRadius = 0.59
	const outerRadius = 0.93
	
	// while firing, do Pacman death animation
	// rotate potential bar counter-clockwise so gap is top center
	const firingOffset = neuron.firing ? neuron.potential * -Math.PI : 0
	
	ctx.savePartial( 'fillStyle', 'globalCompositeOperation' )
	
	// indicate potential
	ctx.beginPath()
		const potentialStart = gaugeStart + firingOffset
		const potentialStop = potentialStart + neuron.potential * tau
		
		ctx.arc( 0, 0, innerRadius, potentialStart, potentialStop ) // cw
		ctx.arc( 0, 0, outerRadius, potentialStop, potentialStart, true ) // ccw
		
		ctx.fillStyle = config.excitatoryColor
		ctx.globalCompositeOperation = config.excitatoryCompositeOperation
		ctx.fill()
	
	if ( !neuron.firing ) {
		// indicate inhibitory input
		
		const inhibitoryStop = Math.max( gaugeStart - ( neuron.inhibitoryInput * tau ), -( tau - potentialStop ) )
		
		ctx.beginPath()
			ctx.arc( 0, 0, innerRadius, gaugeStart, inhibitoryStop, true ) // ccw
			ctx.arc( 0, 0, outerRadius, inhibitoryStop, gaugeStart ) // cw
			
			ctx.fillStyle = config.inhibitoryColor
			ctx.globalCompositeOperation = config.inhibitoryCompositeOperation
			ctx.fill()
	}
	
	ctx.restorePartial()
}

export default function NeuronView( neuron, role = 'think', opts = {} ) {
	const self = Object.create( NeuronView.prototype )
	Object.assign( self, defaultOpts, opts )
	self.neuron = neuron
	self.icon = assets.icons[ role ]
	self.position = { x: 0, y: 0 }
	// TODO relative
	self.anchor   = { x: 0, y: 0 }
	
	self.originalPosition = { x: 0, y: 0 }
	self.originalRadius = self.radius
	self.connectionOpacity = 1
	
	return self
}

NeuronView.prototype = {
	update( dt, dt2 ) {
		const dx = this.anchor.x - this.position.x
		const dy = this.anchor.y - this.position.y
		
		this.position.x += dx * this.clinginess * dt2
		this.position.y += dy * this.clinginess * dt2
		
		// TEMP
		this.radius = defaultOpts.radius
		if ( this.neuron.firing ) this.radius += jiggle( Math.max( 1 - this.neuron.potential, Number.MIN_VALUE ) )
	},
	
	draw( ctx, detail ) {
		ctx.savePartial( 'fillStyle', 'globalAlpha', 'globalCompositeOperation' )
		
		ctx.globalCompositeOperation = 'screen'
		
		ctx.beginPath()
			ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 )
			ctx.fillStyle = this.active ? 'rgba( 90, 195, 255, 0.9 )' : 'rgba( 90, 195, 255, 0.09 )'
			ctx.fill()
		
		// icon
		if ( detail > 0.1 ) {
			ctx.translate( this.position.x, this.position.y )
			
			const rotation = ( -this.neuron.inhibitoryInput * Math.PI * 2 ) % ( Math.PI * 2 )
			if ( !this.neuron.firing ) {
				ctx.rotate( rotation )
			}
			
			const r = this.radius * 0.36
			ctx.savePartial( 'globalAlpha' )
			ctx.globalAlpha *= 1 - ( 1 - detail ) / 0.9
			
			// shift icons by half a pixel right and down to properly center them
			const halfAPixel = r / this.icon.width
			ctx.drawImage( this.icon, -r + halfAPixel, -r + halfAPixel, r * 2, r * 2 )
			
			ctx.restorePartial()
			
			if ( !this.neuron.firing ) {
				ctx.rotate( -rotation )
			}
			
			ctx.translate( -this.position.x, -this.position.y )
		}
		
		ctx.translate( this.position.x, this.position.y )
		ctx.scale( this.radius, this.radius )
		drawGauge( ctx, this.neuron, this.position.x, this.position.y, this.radius )
		ctx.scale( 1 / this.radius, 1 / this.radius )
		ctx.translate( -this.position.x, -this.position.y )
		
		ctx.restorePartial()
	},
}
