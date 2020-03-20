// -------------------------------------------------------------------------- //
//                                                                            //
//                                          eeeee                             //
//         eeeee  eeee eeeee e     e  eeee  8   8  eeeee eeeee  eeeee         //
//         8   8  8    8   8 8     8  8  8  8eee8  8  88 8   8  8   "         //
//         8eee8e 8eee 8eee8 8e    8e 8e   88   88 8   8 8eee8e 8eeee         //
//         88   8 88   88    88    88 88   88   88 8   8 88   8    88         //
//         88   8 88ee 88    88eee 88 88e8 88eee88 8eee8 88   8 8ee88         //
//                                                                            //
//                                                                            //
// -------------------------------------------------------------------------- //

import '@babel/polyfill'
import './main.scss'
import $ from '../third-party/jquery'
import World from './simulation/world'
import Scenario from './simulation/scenario'
import Visualization from './visualization/visualization'
import GameLoop from './engine/game-loop'
import PlayControls from './play-controls'

const CURRENT_VERSION = '1.2-wip'

// on DOM ready
$( () => {
	$( '#version-number' ).html( CURRENT_VERSION )
	
	// create empty world for replicators and other entities to inhabit
	// world updates entities, mediates interactions, emits events
	const world = World()
	
	// set up and monitor experimental scenario
	// (add replicators, subscribe to events, etc.)
	const scenario = Scenario( world )
	
	// drive scenario/world
	const scenarioLoop = GameLoop(
		( dt, t ) => scenario.update( dt, t ),
		() => {} )
	
	const visualization = Visualization( world )
	$( '#visualization' ).append( visualization.$element )
	// initialize dimensions
	visualization.$element.trigger( 'appended' )
	
	// drive visualization
	const visualizationLoop = GameLoop(
		dt => visualization.update( dt, dt * ( scenarioLoop.paused ? 0 : scenarioLoop.timescale ) ),
		() => visualization.draw( 0 ) )
	
	scenarioLoop.on( 'step', dt => {
		// TODO scale dt2 parameter?
		visualization.update( dt, dt )
	} )
	
	function onToggleSuperFast( doVisualization ) {
		if ( doVisualization ) {
			visualization.attach()
		} else {
			visualization.detach()
		}
	}
	const controls = PlayControls( scenarioLoop, onToggleSuperFast )
	
	$( '#play-controls' ).append( controls )
	
	// show info box on first load
	{
		const cookieName = 'hideInfo'
		const cookieValue = '1'
		
		// adapted from https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
		const magic = new RegExp( '(?:(?:^|.*;\s*)' + cookieName + '\s*\=\s*([^;]*).*$)|^.*$' )
		const cookieIsSet = ( document.cookie.replace( magic, '$1' ) === cookieValue )
		
		// except on localhost
		if ( !cookieIsSet && location.host !== 'localhost:8080' ) {
			// no cookie? show info box
			$( '#info' ).fadeIn()
			
			// set cookie so info box isn't shown automatically next time
			document.cookie = `${cookieName}=${cookieValue}; expires=Fri, 31 Dec 9999 23:59:59 GMT`
		}
	}
} )

// prevent accidental navigation, except on localhost
$( window ).on( 'beforeunload', () => {
	if ( location.host !== 'localhost:8080' ) return ''
})
