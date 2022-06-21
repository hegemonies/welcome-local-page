build-docker:
	docker build --tag lt:5000/welcome-local-page:latest .

push-docker:
	docker push lt:5000/welcome-local-page:latest
