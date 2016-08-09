import Food from './food'
import Timer from '../engine/timer'
import Replic8or from './replic8or'
import Predator from './predator'
import Spring from './spring'
import RingBuffer from '../engine/ring-buffer'

const defaultOpts = {
	designatedWidth:  550,
	designatedHeight: 480,
	numReplicators: 7,
	// numPredators: 2,
}

function spawnFood( x, y ) {
	const food = Food()
	
	const angle = Math.random() * Math.PI * 2
	const maxSpeed = 625
	const speed = Math.random() * maxSpeed
	
	food.velocity.x = Math.cos( angle ) * speed
	food.velocity.y = Math.sin( angle ) * speed
	
	// offset spawn position according to initial velocity
	// because it looks nice
	const maxOffset = 32
	food.position.x = x + Math.cos( angle ) * ( speed / maxSpeed ) * maxOffset
	food.position.y = y + Math.sin( angle ) * ( speed / maxSpeed ) * maxOffset
	
	return food
}

export default function Scenario( world, opts = {} ) {
	const self = {}
	Object.assign( self, defaultOpts, opts )
	
	// archive
	const cryo = RingBuffer( self.numReplicators )
	const seed = Replic8or()
	for ( let n = self.numReplicators; n > 0; n-- ) cryo.push( seed.replicate() )
	
	const timer = Timer()
	
	self.doBloom = function ( position, radius, density ) {
		for ( ; density > 0; density-- ) {
			timer.setAlarm( 1 / density, () => {
				const food = Food()
				
				const angle = Math.random() * Math.PI * 2
				const radius2 = Math.random() * radius
				food.position.x = position.x + Math.cos( angle ) * radius2
				food.position.y = position.y + Math.sin( angle ) * radius2
				
				world.addFood( food )
			} )
		}
	}
	
	self.reset = function ( hard ) {
		// remove any existing replicators
		// TODO better way of removing replicators than killing them?
		world.replicators.slice().forEach( replicator => replicator.die() )
		
		// repopulate world from frozen specimens
		cryo.forEach( specimen => {
			const child = specimen.replicate( true )
			child.position.x = 0
			child.position.y = 0
			world.addReplicator( child )
		} )
		
		// remove any existing foods
		// TODO better way of removing foods than spoiling them?
		world.foods.slice().forEach( food => food.spoil() )
		
		world.predators.slice().forEach( predator => world.removePredator( predator ) )
		
		world.springs[0] = Spring( { x: 0, y: 0 } )
		
		timer.cancelAlarms()
		
		const alwaysBeBlooming = () => {
			// random point along edge of world
			const angle = Math.random() * Math.PI * 2
			const position = {}
			position.x = Math.cos( angle ) * ( self.designatedWidth / 2 )
			position.y = Math.sin( angle ) * ( self.designatedWidth / 2 )
			
			// for now, bloom at center of spring
			self.doBloom( { x: 0, y: 0 }, 96, 5 )
			
			timer.setAlarm( 24, alwaysBeBlooming )
		}
		
		timer.setAlarm( 10, alwaysBeBlooming )
		
		const addPredator = () => {
			const predator = Predator()
			
			// random point past edge of world
			const angle = Math.random() * Math.PI * 2
			predator.position.x = Math.cos( angle ) * self.designatedWidth * 2
			predator.position.y = Math.sin( angle ) * self.designatedWidth * 2
			
			world.addPredator( predator )
		}
		
		timer.setAlarm( 2, addPredator )
		// timer.setAlarm( 2, addPredator )
		
		console.log( 'Reset @', new Date() )
	}
	
	world.on( 'replicator-died', body => {
		cryo.push( body )
		if ( world.replicators.length === 0 ) self.reset()
	} )
	
	// TODO predators...
	
	self.update = function ( dt, t ) {
		timer.update( dt )
		world.update( dt, t )
	}
	
	self.reset()
	
	return self
}
