tool
extends Node2D

export (int) var width := 280 setget set_width
export (int) var height := 40 setget set_height
export (int) var show_button := true setget set_show_button

func _draw() -> void:
	draw_rect(Rect2(Vector2(0, 0), Vector2(width, height)), Color.white)

func set_width(value: int) -> void:
	width = value
	update()

func set_height(value: int) -> void:
	height = value
	update()

func set_show_button(value: bool) -> void:
	show_button = value
	$go.visible = value
	update()
