// TODO hot key for normal speed (1?)

import $ from '../third-party/jquery'
import html from './play-controls.html'

export default function PlayControls( gameLoop, onToggleOffline ) {
	const $form = $( html )
	
	// prevent submit
	$form.submit( event => event.preventDefault() )
	
	const $pauseResume = $( '[name=pause-resume]', $form )
	$pauseResume.click( () => {
		gameLoop.paused = !gameLoop.paused
	} )
	$( document ).keydown( event => {
		// spacebar
		if ( event.which === 32 ) {
			event.preventDefault()
			$pauseResume.click()
		}
	} )
	
	const $step = $( '[name=step]', $form )
	$step.click( () => {
		gameLoop.paused = true
		gameLoop.step()
	} )
	$( document ).keydown( event => {
		// right arrow key
		if ( event.which === 39 ) {
			event.preventDefault() // necessary?
			$step.click()
		}
	} )
	
	$( '[name=speed-slow]', $form ).click( () => {
		gameLoop.timescale = 0.1
		gameLoop.paused = false
	} )
	
	$( '[name=speed-normal]', $form ).click( () => {
		gameLoop.timescale = 1
		gameLoop.paused = false
	} )
	
	$( '[name=speed-fast]', $form ).click( () => {
		gameLoop.timescale = 10
		gameLoop.paused = false
	} )
	
	$( '[name=info]', $form ).click( () => {
		$( '#info' ).fadeToggle()
	} )
	
	$( '#info [name=close]' ).click( () => {
		$( '#info' ).fadeToggle()
	} )
	
	$( '[name=offline]', $form ).click( () => {
		if ( $( '[name=offline]' ).is( ':checked' ) ) {
			// run simulation at "max" speed when going offline
			gameLoop.timescale = 30 // simulation ticks per requestAnimationFrame
			gameLoop.paused = false
			
			// disable playback controls when simulating offline
			// they work fine, but it's not clear when you're paused/etc.
			$( '[name=step]' ).prop( 'disabled', true )
			$( '[name=pause-resume]' ).prop( 'disabled', true )
			$( '[name^=speed-]' ).prop( 'disabled', true ) // name begins with "speed-"
			
			// notify
			onToggleOffline( false )
		} else {
			// run simulation at normal speed when going online
			$( '[name=speed-normal]', $form ).click()
			
			// re-enable playback controls
			$( '[name=step]' ).prop( 'disabled', false )
			$( '[name=pause-resume]' ).prop( 'disabled', false )
			$( '[name^=speed-]' ).prop( 'disabled', false )
			
			onToggleOffline( true )
		}
	} )
	
	return $form[ 0 ]
}
